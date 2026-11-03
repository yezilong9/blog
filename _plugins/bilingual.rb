require 'pathname'

module HarryBlog
  class Bilingual < Jekyll::Generator
    safe true
    priority :highest

    def generate(site)
      posts = site.posts.docs
      sources = posts.to_h { |post| [File.basename(post.path, '.*'), post] }
      translations = site.collections.fetch('translations').docs
      paired = {}

      translations.reject! do |translation|
        key = translation.data['translation_of']
        fail_build("Missing translation_of: #{translation.path}") if key.to_s.empty?
        source = sources[key]
        if source.nil?
          extensions = site.config.fetch('markdown_ext').split(',')
          existing_source = extensions.any? { |extension| File.file?(File.join(site.source, '_posts', "#{key}.#{extension}")) }
          fail_build("Unknown translation source: #{key}") unless existing_source
          next true # Keep translations of unpublished or future posts unpublished too.
        end
        fail_build("Duplicate translation: #{key}") if paired.key?(key)
        fail_build("Empty translation: #{translation.path}") if translation.content.strip.empty?
        fail_build("Missing English title: #{translation.path}") if translation.data['title'].to_s.empty?
        fail_build("English URL must start with /en/: #{translation.path}") unless translation.url.start_with?('/en/')
        if paired.values.any? { |document| document.url == translation.url }
          fail_build("Duplicate English URL: #{translation.url}")
        end

        %w[date tags categories cover subclass navigation].each do |field|
          translation.data[field] = source.data[field]
        end
        translation.data['lang'] = 'en'
        translation.data['zh_url'] = source.url
        translation.data['en_url'] = translation.url
        translation.data['home_url'] = '/en/'
        source.data['en_url'] = translation.url
        source.data['english'] = preview(translation)
        paired[key] = translation
        false
      end

      posts.each do |post|
        post.data['lang'] = 'zh-CN'
        post.data['zh_url'] = post.url
        post.data['home_url'] = '/'
        post.data['cover'] = cover_path(post.data['cover'])
      end
      translations.each { |post| post.data['cover'] = cover_path(post.data['cover']) }

      connect_neighbors(posts.sort_by(&:date))
      connect_neighbors(translations.sort_by { |post| [post.date, post.data['translation_of']] })
      Jekyll.logger.info('Bilingual:', "#{translations.size} English translations / #{posts.size} Chinese posts")
    end

    private

    def connect_neighbors(documents)
      documents.each_with_index do |document, index|
        document.data['related_previous'] = index.positive? ? preview(documents[index - 1]) : nil
        document.data['related_next'] = documents[index + 1] ? preview(documents[index + 1]) : nil
      end
    end

    def preview(document)
      {
        'title' => document.data['title'],
        'url' => document.url,
        'excerpt' => document.data['excerpt'] || '',
        'cover' => cover_path(document.data['cover'])
      }
    end

    def cover_path(cover)
      return cover if cover.to_s.empty? || cover.match?(%r{\A(?:https?:)?//})

      Pathname.new("/#{cover}").cleanpath.to_s
    end

    def fail_build(message)
      raise Jekyll::Errors::FatalException, "Bilingual blog: #{message}"
    end
  end
end
