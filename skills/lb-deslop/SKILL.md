---
name: lb-deslop
description: Use when asked to remove AI tells, deslop, de-AI, tighten this up, cut fluff, review a draft for slop, filler, vague language, or formulaic structure, or improve external-facing prose such as client docs, proposals, marketing copy, or published READMEs. Skip routine PR descriptions, commit messages, and Slack updates unless asked.
---

# Deslop: Make Prose Specific, Plain, and Readable

Turn drafty prose into writing a person can read once and understand. Remove AI tells, filler, vague claims, and decorative punctuation.

## Editing Contract

Make prose:

- Specific: name the actor, action, and consequence.
- Plain: choose common words unless a domain term is more precise.
- Readable: cut filler without making the sentence dense.
- Consistent: apply one spelling variant throughout. Default to Australian English. The draft's own spelling is not a signal, so respell it. For client material only, match the client's docs or the existing repo style, and ask if there is no signal.

If a trimmed sentence needs a second read, add words back until it is clear.

## Cut

- Throat-clearing: "Here's the thing," "it's worth noting," "in today's landscape"
- Decorative business words: "leverage," "utilize," "robust," "streamline," "ecosystem," "paradigm"
- Inflated AI vocabulary: "delve," "tapestry," "nuanced," "certainly"
- Verb dodges where "is" works: "serves as," "stands as," "represents"
- Empty adverbs: "really," "actually," "simply," "fundamentally"
- Vague claims: "the reasons are structural," "the implications are significant"
- Unnamed authorities: "experts argue," "many people believe"
- Lazy extremes: "always," "never," "everyone"
- Repeated summaries: say the point once, not before, during, and after.
- Signposted endings: "In conclusion," "To sum up"

## Break Formulas

- Not-this-but-that: replace "Not because X. Because Y." with one direct cause.
- Self-posed questions: replace "The result? Devastating." with a normal sentence.
- Padded three-part lists: if the third item only exists for rhythm, cut it.
  Before: "This makes the workflow faster, clearer, and more empowering."
  After: "This makes the workflow faster and clearer."
- Patronising analogies: remove "think of it like..." unless the comparison teaches something specific.
- Passive voice: name the actor when the actor matters.
- Uniform rhythm: vary sentence length, and do not force every paragraph to end with a punchline.

## Avoid Overused Tells

Default to removing these common tells. Keep one only when it is clearer than the plain alternative.

- Unicode arrows in prose. Write the relationship in words.
- Semicolons in prose. Split the sentence or use "because," "but," or "so."
- Em dashes. Use a comma, period, or parentheses.
- Bold-first bullets where every item starts with a bold label.

## Examples

**Formulaic and vague**

Before: "Here's the thing: the rollout failed. Not because the code was bad. Because the process was broken."

After: "The rollout failed because the migration script skipped rows with null tenant IDs."

**Over-trimmed**

Before: "We utilize a caching layer to facilitate expedited data retrieval, thereby mitigating latency."

Too compressed: "Caching mitigates latency."

Better: "We cache results so lookups do not hit the database every time. That cuts latency."
