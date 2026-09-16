# Attribution

The word vectors under [`data/`](data/) (`words.json`, `vecs-f32.bin`,
`dim_stats.json`) are derived from **GloVe: Global Vectors for Word
Representation** &mdash; Jeffrey Pennington, Richard Socher, and Christopher
D. Manning, *EMNLP 2014*. <https://nlp.stanford.edu/projects/glove/>

Specifically, the `glove.6B.100d` vectors (trained on a 6-billion-token
corpus of Wikipedia 2014 + Gigaword 5, 100 dimensions per word). The
original release is distributed by Stanford NLP under the [Open Data
Commons Public Domain Dedication and License (PDDL) v1.0](https://opendatacommons.org/licenses/pddl/1-0/).

**What was done for this demo:** the full release (400,000 words) was
filtered down to the 25,000 most frequent purely-alphabetic English tokens
(GloVe's vocabulary is ordered by corpus frequency, so this keeps the most
common words and drops punctuation, numerals, and rare tokens), then
re-packed as a flat `Float32Array` binary blob (`vecs-f32.bin`) plus a
`words.json` index. `dim_stats.json` &mdash; the per-dimension mean,
standard deviation, min, max, and the three lowest/highest words for each
of the 100 dimensions &mdash; was computed from that same 25,000-word set
for this demo and is not part of the original GloVe release.
