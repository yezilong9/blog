require 'jekyll'
require 'tmpdir'
require 'fileutils'
require 'uri'
require 'kramdown'
require 'kramdown-parser-gfm'

ROOT = File.expand_path('..', __dir__)
require File.join(ROOT, '_plugins/bilingual')

def code_examples(document)
  Kramdown::Document.new(document.content, input: 'GFM').root.children.select do |node|
    node.type == :codeblock && %w[java xml].include?(node.options[:lang])
  end.map { |node| [node.options[:lang], node.value] }
end

def images(document)
  collect = lambda do |node|
    urls = node.type == :img ? [node.attr['src']] : []
    urls + node.children.flat_map { |child| collect.call(child) }
  end
  collect.call(Kramdown::Document.new(document.content, input: 'GFM').root).map do |url|
    url.start_with?('../assets/') ? url.delete_prefix('..') : url
  end
end

checks = 0
check = lambda do |condition, message|
  raise message unless condition
  checks += 1
end

Dir.mktmpdir('blog-bilingual-test') do |destination|
  site = Jekyll::Site.new(Jekyll.configuration(
    'source' => ROOT, 'destination' => destination, 'quiet' => true
  ))
  site.process
  english = site.collections.fetch('translations').docs
  check.call(!english.empty?, 'No English translations were built')

  ['index.html', 'en/index.html'].each do |path|
    html = File.read(File.join(destination, path))
    lang = path.start_with?('en/') ? 'en' : 'zh-CN'
    check.call(html.include?(%(<html lang="#{lang}">)), "Missing home language: #{path}")
    check.call(html.include?('class="language-switch"'), "Missing language switch: #{path}")
    check.call(html.include?('data-language="en"'), "Missing English link: #{path}")
    check.call(!html.include?('blog.lo168.com//'), "Double slash in canonical URLs: #{path}")
  end

  site.posts.docs.each do |source|
    translated = english.find { |post| post.data['translation_of'] == File.basename(source.path, '.*') }
    if translated.nil?
      check.call(source.data['en_url'].nil?, 'Untranslated post has a broken English link')
      next
    end
    check.call(source.data['en_url'] == translated.url, 'Chinese switch must target its English article')
    check.call(translated.data['zh_url'] == source.url, 'English switch must target its Chinese article')
    check.call(translated.date == source.date, 'Dates must match across languages')
    check.call(!translated.data['excerpt'].to_s.empty?, 'English cards need an English excerpt')
    check.call(code_examples(source) == code_examples(translated), "Changed Java/XML code examples: #{source.path}")
    check.call(images(source) == images(translated), "Missing or reordered article images: #{source.path}")
    section_count = ->(document) { Kramdown::Document.new(document.content, input: 'GFM').root.children.count { |node| node.type == :header } }
    check.call(section_count.call(source) == section_count.call(translated), "Article section count changed: #{source.path}")
    html = File.read(translated.destination(destination))
    check.call(html.include?('<html lang="en">'), 'English article has the wrong document language')
    check.call(!html.include?('Historical note:') && !html.include?('Historical example:'), 'Unrequested editorial note remains')
    check.call(html.include?(%(<a class="qzq-post-back" href="/en/#articles">)), 'Article back link lost its language')
    check.call(!html.include?('href="/enassets/'), 'English asset path is malformed')

    html.scan(/<img[^>]+src="([^"]+)"/).flatten.each do |url|
      next unless url.start_with?('/assets/')
      check.call(File.file?(File.join(destination, URI::DEFAULT_PARSER.unescape(url))), "Missing translated image: #{url}")
    end
    %w[related_next related_previous].each do |key|
      neighbor = translated.data[key]
      check.call(neighbor['url'].start_with?('/en/'), 'English neighbor points to Chinese') if neighbor
    end
  end

  english_home = File.read(File.join(destination, 'en/index.html'))
  check.call(english_home.include?('MCP Without the Jargon'), 'English marquee is not translated')
  check.call(!english_home.include?('别再瞎猜AI黑话'), 'English marquee contains a translated post in Chinese')
  i18n = site.data.fetch('i18n')
  check.call(i18n['en'].keys.sort == i18n['zh-CN'].keys.sort, 'UI translation keys do not match')
end

Dir.mktmpdir('blog-bilingual-fixture') do |source|
  FileUtils.mkdir_p(File.join(source, '_posts'))
  FileUtils.mkdir_p(File.join(source, '_translations'))
  File.write(File.join(source, '_posts/2020-01-01-example.md'), <<~POST)
    ---
    title: Example
    layout: post
    cover: ../assets/images/test.png
    ---
    Original content.
  POST
  config = Jekyll.configuration(
    'source' => source, 'destination' => File.join(source, '_output'),
    'collections' => { 'translations' => { 'output' => true, 'permalink' => '/en/:name/' } },
    'quiet' => true
  )
  site = Jekyll::Site.new(config)
  site.read
  generator = HarryBlog::Bilingual.new
  generator.generate(site)
  original = site.posts.docs.first
  check.call(original.data['en_url'].nil?, 'Untranslated post must not have a fake English URL')
  check.call(original.data['cover'] == '/assets/images/test.png', 'Cover path should work at nested URLs')

  File.write(File.join(source, '_translations/example.md'), <<~POST)
    ---
    title: English example
    translation_of: 2020-01-01-example
    excerpt: An English introduction.
    ---
    Translated content.
  POST
  site.reset
  site.read
  generator.generate(site)
  check.call(site.posts.docs.first.data['en_url'] == '/en/example/', 'Translation pairing failed')

  File.write(File.join(source, '_translations/duplicate.md'), File.read(File.join(source, '_translations/example.md')))
  site.reset
  site.read
  begin
    generator.generate(site)
    raise 'Duplicate translations should fail the build'
  rescue Jekyll::Errors::FatalException => error
    check.call(error.message.include?('Duplicate translation'), 'Wrong duplicate error')
  end

  File.delete(File.join(source, '_translations/duplicate.md'))
  File.write(File.join(source, '_translations/missing.md'), "---\ntitle: Missing\ntranslation_of: missing-source\n---\nText.\n")
  site.reset
  site.read
  begin
    generator.generate(site)
    raise 'Unknown source should fail the build'
  rescue Jekyll::Errors::FatalException => error
    check.call(error.message.include?('Unknown translation source'), 'Wrong missing source error')
  end
  File.delete(File.join(source, '_translations/missing.md'))

  File.write(File.join(source, '_posts/2099-01-01-future.markdown'), "---\ntitle: Future\n---\nNot published yet.\n")
  File.write(File.join(source, '_translations/future.md'), "---\ntitle: Future\ntranslation_of: 2099-01-01-future\n---\nFuture translation.\n")
  site.reset
  site.read
  generator.generate(site)
  check.call(site.collections['translations'].docs.size == 1, 'Future translation leaked into the published site')
end

puts "PASS: #{checks} bilingual build checks"
