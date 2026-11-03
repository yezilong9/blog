---
title: "From RNNs to Transformers: How AI Learned to Understand a Sentence"
translation_of: "2026-10-03-从RNN到Transformer——AI是如何学会理解一句话的？"
excerpt: "A friendly journey through RNNs, LSTMs, attention, and Transformers, without the intimidating formulas."
---

> Why can ChatGPT understand everyday language?
> Why doesn't it mistake a request to write an email for a request to write a resignation letter?
> How does AI know that "apple" sometimes means a fruit and sometimes a phone?

Behind these questions is a bigger one:

**How does AI make sense of human language?**

Let's explore the development of language models, from RNNs to Transformers.

Don't worry: no complicated formulas today. Because formulas are the sort of thing that make AI calculate and humans fall asleep.

---

## 1. To AI, a sentence is not simply a sentence

Consider this sentence:

> Xiaoming went to Beijing yesterday because the university he had always dreamed of attending was there.

Our brains understand that "there" refers to Beijing. A computer starts with something more like a sequence:

```text
Xiaoming
yesterday
went
Beijing
because
there
university
```

It does not automatically know who Xiaoming is, what Beijing is, or why "there" refers to Beijing.

What the computer sees at first is not text, but a sequence of numbers.

So the first challenge is: **how do we get a machine to understand a sentence?**

## 2. RNNs: give AI a little notebook

Researchers had a reasonable idea: people understand language partly because they remember context. Perhaps AI should too.

When you read:

> Xiaoming went to Beijing yesterday because...

The word "because" makes you recall what happened just before it.

This is the basic intuition behind an RNN, or **Recurrent Neural Network**: **read and remember as you go**.

Take the sentence:

```text
Xiaoming yesterday went to Beijing
```

The RNN begins reading. When it sees "Xiaoming", its notebook records:

> There is a person called Xiaoming.

It continues to "yesterday" and updates its notes:

> Something happened to Xiaoming yesterday.

When it reaches "Beijing", it updates them again:

> Xiaoming went to Beijing yesterday.

When "there" appears later, AI opens the notebook and asks, "What place was mentioned just now?"

The answer is Beijing. So it concludes:

> there = Beijing

An RNN is like a diligent student: the teacher says something, it takes a note; the teacher continues, it updates the note.

## 3. The problem: the notebook has limited room

At first, RNNs perform well. With a sentence of only a few dozen characters, they can generally understand it. But what happens as the text gets longer?

> Xiaoming was born in Shanghai... [another 5,000 words] ...and later came here to work.

Ask where "here" means, and the RNN may hesitate. "Shanghai? Or one of the other cities mentioned in between? Wait, what did I write down earlier?"

This is the **long-term dependency problem**.

The notebook analogy helps: imagine reading a 100-page novel while keeping only a short, constantly revised summary. At first, you remember the main character. Later, you may find yourself asking, "Wait, who was Xiaoming again?"

## 4. LSTMs: upgrade to a smarter notebook

Researchers improved the RNN idea with **Long Short-Term Memory**, or **LSTM**, networks.

Think of an LSTM as **a notebook that automatically sorts information**. An ordinary notebook records everything. The smart notebook saves important information and discards what is not important.

In a story, "Xiaoming loves basketball" is important and may affect the plot later. Keep it! But "The weather was pleasant yesterday afternoon" is not very relevant to the story. Delete it!

LSTMs improved the ability to retain useful information over longer sequences. But they still process the sequence step by step.

## 5. Transformers: AI learns to look at the whole article at once

In 2017, the Transformer brought a major change.

The biggest change was not making AI remember more. It was **letting AI see all the information at the same time**.

An RNN reads like we read a book: page one, page two, page three, turning one page after another.

A Transformer reads more like opening a PDF: everything is displayed together. It then asks, "Which words have the most important relationships?"

Consider:

> Xiaoming went to Beijing yesterday because there was a university there.

When the Transformer sees "there", it does not look only at the preceding word. It looks at the whole sentence and asks, "Which word has the strongest relationship with 'there'?"

```text
there -- Xiaoming     weaker relationship
there -- yesterday    weaker relationship
there -- Beijing      stronger relationship
```

AI therefore understands that "there" means Beijing. This ability is called **Attention**.

Simply put, attention teaches AI not to look at all information equally, but to focus on the important information.

## 6. What is attention like?

Humans do something similar when reading:

> Jack Ma founded Alibaba.

Where does your attention go? To "Jack Ma" and "Alibaba", of course. You do not focus on small connecting words such as "a" and "the", because they are not the important parts.

Attention gives AI a similar ability. It automatically determines which words are important, which are supporting words, and which words are related.

## 7. RNNs and Transformers: two employees

Imagine giving two employees a 100-page requirements document.

### The RNN employee

"Please read this document."

"Sure. Page one... update my notes. Page two... revise the notes. Page three... keep going."

A hundred pages later, you ask for a summary.

"I remember it was about some kind of system..."

### The Transformer employee

"Please read this document."

"Wait a moment."

Snap! All the pages are open.

"The user requirements are on page 20. Technical requirements are on page 50. The launch date is on page 80. This information needs to be connected."

This is where Transformers are powerful: they do not just remember information, but actively look for relationships between pieces of information.

## 8. Why do models such as ChatGPT use Transformers?

The problems ChatGPT faces are much more complex than ordinary text. It needs to handle:

- Summarizing long documents.
- Generating code.
- Analyzing files.
- Answering questions.
- Everyday conversations.

It may even need to understand hundreds of thousands of characters of information.

RNNs read slowly, can forget things in long texts, and cannot fully take advantage of parallel GPU computation.

Transformers can process large amounts of information at the same time, understand context better, and are better suited to large-scale training. That is why today's large language models, including GPT, Claude, Gemini, and Llama, are essentially based on the Transformer architecture.

## 9. What changed along the way?

We can summarize the journey in three stages:

**RNN:** "I can carry information from earlier steps." The memory can be fragile over long sequences.

**LSTM:** "I can learn what to keep and what to forget." The processing is still recurrent.

**Transformer:** "I can not only see everything, but also tell which information is most important."

And so, the era of large language models began.

A simplified learning roadmap looks like this:

```text
RNN
  |
LSTM
  |
Attention
  |
Transformer
  |
GPT-style language models
```

## 10. How deeply should a developer study this?

For an ordinary developer, understanding the idea behind RNNs is enough; you do not need to go very deep, because they are no longer the main direction.

But Transformers are something you should master, because the core technical path for future AI application development is:

```text
Transformer
          |
Large language models
          |
RAG knowledge bases
          |
AI agents
          |
Enterprise AI applications
```

## Final thoughts

ChatGPT did not appear out of nowhere. It rests on decades of research.

From RNNs teaching AI to remember the past to Transformers teaching it to focus on what matters, AI grew from a schoolchild who could only recite answers into an intelligent assistant that can chat, write code, and analyze problems.

Understanding the journey from RNNs to Transformers is our first step toward learning AI.
