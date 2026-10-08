import { db } from '../src/db.js';

function runSeed() {
  db.exec('DELETE FROM links');
  db.exec('DELETE FROM note_terms');
  db.exec('DELETE FROM terms');
  db.exec('DELETE FROM notes');

  const notesData = [
    { id: 1, summary: 'Control Systems: Negative Feedback', text: 'Negative feedback systems regulate output by subtracting the current state from the target setpoint, creating an error signal that drives the system back to equilibrium.' },
    { id: 2, summary: 'Biology: Blood Glucose', text: 'When blood glucose rises, the pancreas secretes insulin, causing cells to absorb glucose. This lowers blood sugar back to normal levels, preventing hyperglycemia.' },
    { id: 3, summary: 'Networks: TCP AIMD', text: 'TCP congestion control uses Additive Increase Multiplicative Decrease (AIMD). It increases window size slowly but halves it when packet loss occurs to prevent network collapse.' },
    { id: 4, summary: 'OS: Deadlock Conditions', text: 'Deadlock requires four conditions: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.' },
    { id: 5, summary: 'Economics: RBI Repo Rate', text: 'When inflation is high, the Reserve Bank of India (RBI) increases the repo rate. This makes borrowing more expensive, reducing money supply and cooling down inflation.' },
    { id: 6, summary: 'Economics: Supply and Demand', text: 'In a free market, if demand exceeds supply, prices rise. Higher prices incentivize more production, which eventually increases supply and brings the price back to equilibrium.' },
    { id: 7, summary: 'ML: Gradient Descent', text: 'Gradient descent updates weights in the opposite direction of the gradient to minimize the loss function. A high learning rate can cause the loss to oscillate around the minimum.' },
  ];

  const insertNote = db.prepare('INSERT INTO notes (text, summary) VALUES (?, ?)');
  
  const ids = {};
  for (const n of notesData) {
    const res = insertNote.run(n.text, n.summary);
    ids[n.id] = res.lastInsertRowid;
  }

  const linksData = [
    { src: ids[1], dst: ids[2], type: 'same_idea', strength: 5, reason: 'Both describe biological and mechanical negative feedback loops that maintain homeostasis/equilibrium.' },
    { src: ids[1], dst: ids[5], type: 'same_idea', strength: 5, reason: 'Both use a negative feedback mechanism: RBI regulates the economy (output) by adjusting rates (input) to counteract inflation (error).' },
    { src: ids[1], dst: ids[6], type: 'same_idea', strength: 4, reason: 'Market prices act as a negative feedback mechanism to balance supply and demand.' },
    { src: ids[3], dst: ids[1], type: 'same_idea', strength: 4, reason: 'TCP AIMD is a form of negative feedback where packet loss (error signal) causes a reduction in window size to maintain network stability.' },
    { src: ids[7], dst: ids[1], type: 'same_idea', strength: 4, reason: 'Gradient descent uses the gradient (error signal) to adjust weights and find a minimum (equilibrium).' }
  ];

  const insertLink = db.prepare('INSERT INTO links (src, dst, type, strength, reason, origin) VALUES (?, ?, ?, ?, ?, ?)');
  
  for (const l of linksData) {
    insertLink.run(l.src, l.dst, l.type, l.strength, l.reason, 'auto');
  }

  console.log("Database seeded successfully with test data!");
}

runSeed();
