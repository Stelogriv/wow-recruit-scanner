/** Retail classes and specs for the "who do I need" checkboxes. Values match Raider.IO's names. */
export const CLASS_SPECS: Record<string, string[]> = {
  "Death Knight": ["Blood", "Frost", "Unholy"],
  "Demon Hunter": ["Havoc", "Vengeance", "Devourer"],
  Druid: ["Balance", "Feral", "Guardian", "Restoration"],
  Evoker: ["Augmentation", "Devastation", "Preservation"],
  Hunter: ["Beast Mastery", "Marksmanship", "Survival"],
  Mage: ["Arcane", "Fire", "Frost"],
  Monk: ["Brewmaster", "Mistweaver", "Windwalker"],
  Paladin: ["Holy", "Protection", "Retribution"],
  Priest: ["Discipline", "Holy", "Shadow"],
  Rogue: ["Assassination", "Outlaw", "Subtlety"],
  Shaman: ["Elemental", "Enhancement", "Restoration"],
  Warlock: ["Affliction", "Demonology", "Destruction"],
  Warrior: ["Arms", "Fury", "Protection"],
}

/** Checkbox value is "Class:Spec" because spec names repeat across classes (Frost, Holy, …). */
export const specKey = (cls: string, spec: string) => `${cls}:${spec}`
