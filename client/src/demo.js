// Demo mode for the verifier (docs/BUILD_GUIDE.md section 8): a hand-written
// story that deliberately drops "unless…", "at most", "₹2" and "14-day" from
// the library-rule seed note, so the red flags fire reliably on stage.
export const SABOTAGED = {
  matches: (note) => note.text.startsWith('Books can be renewed'),
  text: 'The library lets you renew a book twice. If you return it late, you pay a small fine each day after the loan period.',
};
