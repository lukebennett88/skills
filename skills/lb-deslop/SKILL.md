---
name: lb-deslop
description: Use when asked to remove AI tells, deslop, de-AI, tighten this up, cut fluff, review a draft for slop, filler, vague language, or formulaic structure, or improve external-facing prose such as client docs, proposals, marketing copy, or published READMEs. Skip routine PR descriptions, commit messages, and Slack updates unless asked.
---

# Deslop: make prose specific, plain, and readable

Turn drafty prose into writing a person can read once and understand. Remove AI tells, filler, vague claims, and decorative punctuation.

## Editing contract

Make prose:

- Specific: name the actor, action, and consequence.
- Plain: choose common words unless a domain term is more precise.
- Readable: cut filler without making the sentence dense.
- Consistent: apply one spelling variant throughout. Default to Australian English. The draft's own spelling is not a signal, so respell it. For client material only, match the client's docs or the existing repo style, and ask if there is no signal.

If a trimmed sentence needs a second read, add words back until it is clear.

## Rewrite process

1. Find the real claim and lead with it.
2. Name who does what, and what changes because of it. Prefer active voice when the actor matters.
3. Use concrete nouns and verbs. Keep domain terms when they are more precise than plain words.
4. Cut framing, throat-clearing, fake stakes, and emphasis that evidence can replace.
5. Rebuild the sentence plainly, with enough connective tissue for the reader to follow it.
6. Read it once. If it feels clipped or dense, add back the words that carry meaning.

## Cut

- Throat-clearing: "Here's the thing," "it's worth noting," "in today's landscape."
  Why bad: delays the point. Fix: start with the claim. "Here's the thing: the rollout failed." -> "The rollout failed."
- Reveal framing: "the biggest unlock," "the part that changes everything."
  Why bad: tells the reader to be impressed before proving anything. Fix: name the capability. "the biggest unlock" -> "designers can test states without rebuilding the prototype."
- Decorative business words: "leverage," "utilize," "robust," "streamline," "ecosystem," "paradigm."
  Why bad: sounds polished while hiding the actor. Fix: use the plain verb. "utilize cached data" -> "use cached data."
- Inflated AI vocabulary: "delve," "tapestry," "nuanced," "transformative," "seamless."
  Why bad: adds sophistication without information. Fix: use the word an expert would say out loud. "delve into usage patterns" -> "review usage patterns."
- Verb dodges where "is" works: "serves as," "stands as," "represents," "acts as."
  Why bad: turns identity into ceremony. Fix: use "is" unless the stronger verb is specific. "serves as the entry point" -> "is the entry point."
- Empty adverbs: "really," "actually," "simply," "fundamentally," "deeply."
  Why bad: asks emphasis to do the work of evidence. Fix: cut the adverb or add the evidence. "really fast" -> "renders in under 200ms."
- Vague consequence claims: "the reasons are structural," "the implications are significant."
  Why bad: gestures at importance without saying what changes. Fix: name the cause or affected user. "the implications are significant" -> "support teams now handle billing changes manually."
- Importance framing: "the most important part," "the broader lesson," "just as importantly."
  Why bad: announces significance instead of making the point. Fix: state the claim and let evidence carry it. "the broader lesson is that adoption matters" -> "adoption determines whether the tool spreads."
- Unnamed authorities: "experts argue," "many people believe," "the industry agrees."
  Why bad: borrows authority without sourcing it. Fix: name the source or make the claim yourself. "experts argue" -> "Stripe's design team found."
- Fake contrast: "not just X, but Y," "this is more than X," "it is not about X, it is about Y."
  Why bad: creates drama when both sides are usually true. Fix: state the relationship directly. "not just a prototype, but a handoff tool" -> "the prototype also gives engineers code they can reuse."
- Scale inflation: "at scale," "enterprise-grade," "mission-critical," "production-ready" with no concrete scale.
  Why bad: borrows seriousness without proving the stakes. Fix: name the scale or risk. "enterprise-grade" -> "supports 20,000 accounts with audit logs."
- Agency laundering: "this enables teams to move faster," "the platform empowers developers."
  Why bad: hides the action behind enablement language. Fix: say what the person or product does. "enables teams to move faster" -> "designers publish prototypes without engineering setup."
- Lazy extremes: "always," "never," "everyone," "nothing," "all."
  Why bad: creates claims the prose cannot defend. Fix: qualify with the actual scope. "everyone uses it" -> "the product design team uses it."
- Repeated summaries: say the point once, not before, during, and after.
- Signposted endings: "In conclusion," "To sum up."
  Why bad: tells the reader the piece is ending instead of ending it. Fix: write the final useful sentence and stop.
- Hype endings: "we can't wait to see what you build," "the possibilities are endless."
  Why bad: swaps a concrete next step for applause. Fix: give the next action or end earlier. "the possibilities are endless" -> "Start by documenting the components the agent can use."

## Keep when useful

- Keep signposting when the reader needs navigation through a long or branching explanation.
- Keep repetition when it prevents ambiguity.
- Keep a technical term when the plain alternative is less precise.

## Break formulas

- Not-this-but-that: replace "Not because X. Because Y." with one direct cause.
- Self-posed questions: replace "The result? Devastating." with a normal sentence.
- Mental-model throat-clearing: replace "the mental model that makes this click" with the rule itself.
- Padded three-part lists: if the third item only exists for rhythm, cut it.
  Before: "This makes the workflow faster, clearer, and more empowering."
  After: "This makes the workflow faster and clearer."
- Patronising analogies: remove "think of it like..." unless the comparison teaches something specific.
- Passive voice: name the actor when the actor matters.
- Uniform rhythm: vary sentence length, and do not force every paragraph to end with a punchline.

## Avoid overused tells

Default to removing these common tells. Keep one only when it is clearer than the plain alternative.

- Unicode arrows in prose. Write the relationship in words.
- Semicolons in prose. Split the sentence or use "because," "but," or "so."
- Em dashes. Use a comma, period, or parentheses.
- Bold-first bullets where every item starts with a bold label.
- Label-style list items such as "Problem: ...", "Cause: ...", "Fix: ...". Prefer plain sentences unless the list structure clearly improves clarity.

## Examples

**Formulaic and vague**

Before: "Here's the thing: the rollout failed. Not because the code was bad. Because the process was broken."

After: "The rollout failed because the migration script skipped rows with null tenant IDs."

**Over-trimmed**

Before: "We utilize a caching layer to facilitate expedited data retrieval, thereby mitigating latency."

Too compressed: "Caching mitigates latency."

Better: "We cache results so lookups do not hit the database every time. That cuts latency."
