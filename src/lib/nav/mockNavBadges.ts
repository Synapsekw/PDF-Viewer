// ===== MOCK_DATA_START (NavBadges) =====
export async function getNavBadges() {
  await new Promise(r => setTimeout(r, 200));
  return { documents: 0, questionsNew: 0 }; // keep zero for now; will extend later
}
// ===== MOCK_DATA_END (NavBadges) =====
// TODO: Delete this mock when real nav badges API is integrated.
