# Bestiary — Bad Blood
*Every creature in the arc as a ready `statblock` (Fantasy Statblocks renders these). RTHW blocks are transcribed from your photos of *The Horrors Within* Ch. 5; the common creatures are pulled from your **SRD 5.2.1 (2024)** so they match your books. The Wereraven is a working approximation — swap in RTHW's if it differs.*

> [!tip] Which fight uses what
> **S1 Tavern:** Alenka (Slasher) · Mirabel (Gravecaller) + 2 Ghoul · Sorvina (Horror) + Minotaur Skeleton.
> **S2 Church siege:** Ghoul · Dire Wolf · Vampire Spawn · Vampire Mind Flayer (prototype) · Wereraven (Keeper allies).
> **S3 Old Churchyard:** Vampire Spawn ×2 · Vampire Mind Flayer · Lyssa (Nightbringer) · Vampire Nosferatu · Swarm of Infesting Insects · Spy (Ernst).

---

## RTHW Ch. 5 — the new horrors

### Relentless Slasher — Alenka (CR 8)
```statblock
layout: Basic 5e Layout
name: Relentless Slasher (Alenka)
size: Medium
type: fiend
alignment: neutral evil
ac: 15
hp: 91
hit_dice: 14d8+28
speed: 40 ft.
stats: [12, 18, 14, 14, 15, 16]
saves:
  - str: 4
  - dex: 7
  - con: 5
  - wis: 5
condition_immunities: "Charmed, Frightened"
senses: "Darkvision 120 ft., passive Perception 12"
languages: "Understands all languages but can't speak"
cr: 8
traits:
  - name: Legendary Resistance (1/Day)
    desc: "If the slasher fails a saving throw, it can choose to succeed instead."
actions:
  - name: Multiattack
    desc: "The slasher makes two Slasher's Knife attacks."
  - name: Slasher's Knife
    desc: "Melee or Ranged Attack Roll: +7, reach 5 ft. or range 30/60 ft. Hit: 9 (2d4+4) Slashing damage plus 21 (6d6) Necrotic damage."
legendary_actions:
  - name: "Legendary Action Uses: 3"
    desc: "Immediately after another creature's turn, the slasher can expend a use to take one of the following actions. It regains all expended uses at the start of each of its turns."
  - name: Homing Knife
    desc: "Dexterity Saving Throw: DC 15, one creature within 120 ft. the slasher has hit with its Slasher's Knife in the last 24 hours. Failure: 11 (2d6+4) Slashing damage."
  - name: Vanishing Strike
    desc: "The slasher makes one Slasher's Knife attack, then teleports up to 30 ft. to an unoccupied space it can see. It can't take this action again until the start of its next turn."
```

### Ghast Gravecaller — Mirabel (CR 6)
```statblock
layout: Basic 5e Layout
name: Ghast Gravecaller (Mirabel)
size: Medium
type: undead
alignment: chaotic evil
ac: 16
hp: 97
hit_dice: 15d8+30
speed: 30 ft.
stats: [16, 17, 14, 18, 14, 8]
saves:
  - con: 5
  - wis: 5
damage_immunities: "Necrotic, Poison"
condition_immunities: "Charmed, Exhaustion, Poisoned"
senses: "Darkvision 120 ft., passive Perception 12"
languages: "Abyssal, Common"
cr: 6
traits:
  - name: Stench
    desc: "Constitution Saving Throw: DC 13, any creature that starts its turn in a 5-foot Emanation originating from the ghast. Failure: Poisoned until the start of its next turn. Success: Immune to this ghast's Stench for 24 hours."
actions:
  - name: Multiattack
    desc: "The ghast makes two Horrific Necrosis attacks. It can replace one attack with a Claw attack."
  - name: Claw
    desc: "Melee Attack Roll: +6, reach 5 ft. Hit: 13 (3d6+3) Slashing damage. If the target isn't an Undead, it has the Paralyzed condition until the end of its next turn."
  - name: Horrific Necrosis
    desc: "Melee or Ranged Attack Roll: +7, reach 5 ft. or range 120 ft. Hit: 15 (2d10+4) Necrotic damage, and the target has the Frightened condition until the end of its next turn."
  - name: Spellcasting
    desc: "At Will (Intelligence, no Material components): Speak with Dead, Thaumaturgy."
```

### Unspeakable Horror — Sorvina (CR 8)
```statblock
layout: Basic 5e Layout
name: Unspeakable Horror (Sorvina)
size: Huge
type: monstrosity
alignment: chaotic evil
ac: 13
hp: 126
hit_dice: 12d12+48
speed: 40 ft.
stats: [21, 13, 19, 3, 14, 17]
saves:
  - con: 7
  - wis: 5
damage_resistances: "Acid, Cold, Necrotic, Poison"
condition_immunities: "Frightened, Grappled, Prone, Restrained"
senses: "Truesight 60 ft., passive Perception 12"
languages: "None"
cr: 8
traits:
  - name: Incomprehensible Form
    desc: "Attack rolls against the horror have Disadvantage. This trait is suppressed while the horror has the Incapacitated condition."
  - name: Regeneration
    desc: "The horror regains 10 Hit Points at the start of each of its turns if it has at least 1 Hit Point."
  - name: Terrifying Aura
    desc: "The horror radiates an aura in a 15-foot Emanation while it doesn't have the Incapacitated condition. Wisdom Saving Throw: DC 15, any enemy that starts its turn in the aura. Failure: Frightened until the start of its next turn; while Frightened this way, the target also has the Paralyzed condition. Success: Immune for 24 hours."
actions:
  - name: Multiattack
    desc: "The horror makes three Phantasmic Assault attacks."
  - name: Phantasmic Assault
    desc: "Melee or Ranged Attack Roll: +8, reach 5 ft. or range 60 ft. Hit: 14 (4d6) Cold, Necrotic, Poison, or Psychic damage (horror's choice)."
reactions:
  - name: Warp Mind
    desc: "Trigger: A creature the horror can see within 120 ft. takes the Study action or makes a Constitution save to maintain Concentration. Response—Wisdom Saving Throw: DC 15, the triggering creature. Failure: 7 (2d6) Psychic damage, and the target is Stunned until the end of its next turn."
```

### Vampire Nightbringer — Lyssa (CR 8)
```statblock
layout: Basic 5e Layout
name: Vampire Nightbringer (Lyssa von Zarovich)
size: Medium
type: undead
alignment: neutral evil
ac: 16
hp: 142
hit_dice: 19d8+57
speed: 30 ft., fly 30 ft. (hover)
stats: [16, 18, 16, 13, 14, 15]
saves:
  - dex: 7
  - wis: 5
skillsaves:
  - perception: 5
  - stealth: 7
damage_immunities: "Cold, Necrotic"
condition_immunities: "Charmed, Exhaustion, Frightened"
senses: "Darkvision 120 ft., passive Perception 15"
languages: "Common plus one other language"
cr: 8
traits:
  - name: Sunlight Hypersensitivity
    desc: "The vampire takes 10 Radiant damage if it starts its turn in sunlight. While in sunlight, it has Disadvantage on attack rolls and ability checks."
actions:
  - name: Multiattack
    desc: "The vampire makes one Bite attack and one Shadow Strike attack."
  - name: Bite
    desc: "Melee Attack Roll: +7, reach 5 ft. Hit: 7 (1d6+4) Piercing plus 10 (3d6) Necrotic damage. The target's Hit Point maximum decreases by an amount equal to the Necrotic damage taken, and the vampire regains Hit Points equal to that amount."
  - name: Shadow Strike
    desc: "Melee Attack Roll: +7, reach 5 ft. Hit: 7 (1d6+4) Slashing plus 14 (4d6) Cold damage."
bonus_actions:
  - name: Shadow Stealth
    desc: "While in Dim Light or Darkness, the vampire takes the Hide action."
```

### Vampire Mind Flayer (CR 5)
```statblock
layout: Basic 5e Layout
name: Vampire Mind Flayer
size: Medium
type: undead
alignment: chaotic evil
ac: 15
hp: 85
hit_dice: 10d8+40
speed: 30 ft., climb 30 ft.
stats: [18, 18, 18, 5, 15, 18]
saves:
  - dex: 7
  - con: 4
  - wis: 5
  - cha: 7
skillsaves:
  - perception: 5
  - stealth: 7
damage_resistances: "Necrotic, Psychic"
damage_immunities: "Poison"
condition_immunities: "Charmed, Exhaustion, Frightened, Poisoned"
senses: "Darkvision 120 ft., passive Perception 15"
languages: "Understands Deep Speech but can't speak"
cr: 5
traits:
  - name: Spider Climb
    desc: "The mind flayer can climb difficult surfaces, including along ceilings, without an ability check."
  - name: Sunlight Hypersensitivity
    desc: "The mind flayer takes 20 Radiant damage if it starts its turn in sunlight. While in sunlight, it has Disadvantage on attack rolls and ability checks."
actions:
  - name: Multiattack
    desc: "The mind flayer makes two Claw attacks, or one Claw attack and one Tentacles attack, and uses Mind Burst if available."
  - name: Claw
    desc: "Melee Attack Roll: +7, reach 5 ft. Hit: 8 (1d8+4) Slashing plus 10 (3d6) Necrotic damage."
  - name: Tentacles
    desc: "Melee Attack Roll: +7, reach 5 ft. Hit: 11 (2d6+4) Piercing damage. If the target is Medium or smaller, it is Grappled (escape DC 14)."
  - name: Drink Sapience
    desc: "Wisdom Saving Throw: DC 15, one creature the mind flayer has Grappled. Failure: 21 (6d6) Psychic damage, and the creature gains 1 Exhaustion level. The target's Hit Point maximum decreases by the Psychic damage taken, and the mind flayer regains that many Hit Points."
  - name: Mind Burst (Recharge 5-6)
    desc: "Intelligence Saving Throw: DC 15, each creature in a 30-foot Emanation. Failure: Incapacitated; repeats the save at the end of each of its turns, ending the effect on a success. After 1 minute it succeeds automatically."
```

### Vampire Nosferatu — Elder Evil (CR 8)
```statblock
layout: Basic 5e Layout
name: Vampire Nosferatu (Elder Evil)
size: Medium
type: undead
alignment: chaotic evil
ac: 16
hp: 85
hit_dice: 9d8+45
speed: 40 ft., climb 40 ft.
stats: [20, 18, 21, 6, 17, 14]
saves:
  - str: 5
  - dex: 7
  - con: 8
  - wis: 6
skillsaves:
  - perception: 6
  - stealth: 10
damage_resistances: "Necrotic"
damage_immunities: "Poison"
condition_immunities: "Charmed, Exhaustion, Frightened, Poisoned"
senses: "Darkvision 120 ft., passive Perception 16"
languages: "Common plus one other language"
cr: 8
traits:
  - name: Blood Frenzy
    desc: "The nosferatu has Advantage on attack rolls against any creature that doesn't have all its Hit Points."
  - name: Regeneration
    desc: "The nosferatu regains 10 Hit Points at the start of each of its turns if it has at least 1 Hit Point. If it takes Radiant damage, this trait doesn't function on its next turn."
  - name: Spider Climb
    desc: "The nosferatu can climb difficult surfaces, including along ceilings, without an ability check."
  - name: Sunlight Hypersensitivity
    desc: "The nosferatu takes 20 Radiant damage if it starts its turn in sunlight. While in sunlight, it has Disadvantage on attack rolls and ability checks."
actions:
  - name: Multiattack
    desc: "The nosferatu makes one Bite attack and two Claw attacks."
  - name: Bite
    desc: "Melee Attack Roll: +8, reach 5 ft. Hit: 9 (1d8+5) Piercing plus 11 (2d10) Necrotic damage. The target's Hit Point maximum decreases by the Necrotic damage taken, and the nosferatu regains that many Hit Points."
  - name: Claw
    desc: "Melee Attack Roll: +8, reach 5 ft. Hit: 9 (1d8+5) Slashing damage."
  - name: Blood Spew (Recharge 5-6)
    desc: "Constitution Saving Throw: DC 16, each creature in a 15-foot Cone. Failure: 27 (6d8) Necrotic damage, and the creature can't regain Hit Points for 1 minute. Success: Half damage only."
reactions:
  - name: Bloodthirsty Slash
    desc: "Trigger: A Bloodied creature the nosferatu can see within 40 ft. takes damage. Response: The nosferatu moves up to its Speed without provoking Opportunity Attacks and makes a Claw attack against the triggering creature."
```

### Swarm of Infesting Insects (CR 2)
```statblock
layout: Basic 5e Layout
name: Swarm of Infesting Insects
size: Medium
type: swarm of Tiny beasts
alignment: unaligned
ac: 13
hp: 33
hit_dice: 6d8+6
speed: 20 ft., climb 20 ft., swim 20 ft.
stats: [3, 14, 12, 1, 7, 1]
damage_resistances: "Bludgeoning, Piercing, Slashing"
condition_immunities: "Charmed, Frightened, Grappled, Paralyzed, Petrified, Prone, Restrained, Stunned"
senses: "Blindsight 30 ft., passive Perception 8"
languages: "None"
cr: 2
traits:
  - name: Swarm
    desc: "The swarm can occupy another creature's space and vice versa, and can move through any opening large enough for a Tiny creature. It can't regain Hit Points or gain Temporary Hit Points."
actions:
  - name: Infestation
    desc: "Melee Attack Roll: +4, reach 5 ft. Hit: 12 (4d4+2) Poison damage, or 7 (2d4+2) if the swarm is Bloodied, and the target is Poisoned. If still Poisoned after 1 hour: Constitution Saving Throw DC 11. Failure: roll 1d6 — 1-2 Blinded; 3-4 HP max decreases by 5 (1d10); 5-6 gains 1 Exhaustion level (lasts until Poisoned ends). Success: Poisoned ends."
```

---

## SRD 5.2.1 (2024) — common creatures

### Ghoul (CR 1)
```statblock
layout: Basic 5e Layout
name: Ghoul
size: Medium
type: undead
alignment: chaotic evil
ac: 12
hp: 22
hit_dice: 5d8
speed: 30 ft.
stats: [13, 15, 10, 7, 10, 6]
damage_immunities: "Poison"
condition_immunities: "Charmed, Exhaustion, Poisoned"
senses: "Darkvision 60 ft., passive Perception 10"
languages: "Common"
cr: 1
actions:
  - name: Multiattack
    desc: "The ghoul makes two Bite attacks."
  - name: Bite
    desc: "Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6+2) Piercing plus 3 (1d6) Necrotic damage."
  - name: Claw
    desc: "Melee Attack Roll: +4, reach 5 ft. Hit: 4 (1d4+2) Slashing damage. If the target isn't an Undead or elf: DC 10 Con — on a failure it has the Paralyzed condition until the end of its next turn."
```

### Minotaur Skeleton (CR 2)
```statblock
layout: Basic 5e Layout
name: Minotaur Skeleton
size: Large
type: undead
alignment: lawful evil
ac: 12
hp: 45
hit_dice: 6d10+12
speed: 40 ft.
stats: [18, 11, 15, 6, 8, 5]
damage_vulnerabilities: "Bludgeoning"
damage_immunities: "Poison"
condition_immunities: "Exhaustion, Poisoned"
senses: "Darkvision 60 ft., passive Perception 9"
languages: "Understands Abyssal but can't speak"
cr: 2
actions:
  - name: Gore
    desc: "Melee Attack Roll: +6, reach 5 ft. Hit: 11 (2d6+4) Piercing damage. If the target is Large or smaller and the skeleton moved 20+ ft. straight toward it before the hit, the target takes an extra 9 (2d8) Piercing damage and has the Prone condition."
  - name: Slam
    desc: "Melee Attack Roll: +6, reach 5 ft. Hit: 15 (2d10+4) Bludgeoning damage."
```

### Vampire Spawn (CR 5)
```statblock
layout: Basic 5e Layout
name: Vampire Spawn
size: Medium
type: undead
alignment: neutral evil
ac: 16
hp: 90
hit_dice: 12d8+36
speed: 30 ft.
stats: [16, 16, 16, 11, 10, 12]
saves:
  - dex: 6
  - wis: 3
skillsaves:
  - perception: 3
  - stealth: 6
damage_resistances: "Necrotic"
senses: "Darkvision 60 ft., passive Perception 13"
languages: "Common plus one other language"
cr: 5
traits:
  - name: Spider Climb
    desc: "Can climb difficult surfaces, including ceilings, without an ability check."
  - name: Vampire Weakness
    desc: "Forbiddance: can't enter a residence without an occupant's invitation. Running Water: 20 Acid damage if it ends its turn in running water. Stake to the Heart: destroyed if a Piercing weapon is driven into its heart while it has the Incapacitated condition. Sunlight: 20 Radiant damage if it starts its turn in sunlight; Disadvantage on attacks and ability checks in sunlight."
actions:
  - name: Multiattack
    desc: "The vampire makes two Claw attacks and uses Bite."
  - name: Claw
    desc: "Melee Attack Roll: +6, reach 5 ft. Hit: 8 (2d4+3) Slashing damage. If the target is Medium or smaller, it is Grappled (escape DC 13)."
  - name: Bite
    desc: "Constitution Saving Throw: DC 14, one creature within 5 ft. that is willing or Grappled/Incapacitated/Restrained. Failure: 5 (1d4+3) Piercing plus 10 (3d6) Necrotic damage. The target's HP maximum decreases by the Necrotic taken and the vampire regains that many HP."
bonus_actions:
  - name: Deathless Agility
    desc: "The vampire takes the Dash or Disengage action."
```

### Dire Wolf (CR 1)
```statblock
layout: Basic 5e Layout
name: Dire Wolf
size: Large
type: beast
alignment: unaligned
ac: 14
hp: 22
hit_dice: 3d10+6
speed: 50 ft.
stats: [17, 15, 15, 3, 12, 7]
skillsaves:
  - perception: 5
  - stealth: 4
senses: "Darkvision 60 ft., passive Perception 15"
languages: "None"
cr: 1
traits:
  - name: Pack Tactics
    desc: "Advantage on an attack roll against a creature if at least one of the wolf's allies is within 5 ft. of it and not Incapacitated."
actions:
  - name: Bite
    desc: "Melee Attack Roll: +5, reach 5 ft. Hit: 8 (1d10+3) Piercing damage. If the target is Large or smaller, it has the Prone condition."
```

### Spy — Ernst Larnak (CR 1)
```statblock
layout: Basic 5e Layout
name: Spy (Ernst Larnak)
size: Medium
type: humanoid
alignment: neutral
ac: 12
hp: 27
hit_dice: 6d8
speed: 30 ft., climb 30 ft.
stats: [10, 15, 10, 12, 14, 16]
skillsaves:
  - deception: 5
  - insight: 4
  - investigation: 5
  - perception: 6
  - sleight of hand: 4
  - stealth: 6
senses: "passive Perception 16"
languages: "Common plus one other language"
cr: 1
actions:
  - name: Shortsword
    desc: "Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6+2) Piercing plus 7 (2d6) Poison damage."
  - name: Hand Crossbow
    desc: "Ranged Attack Roll: +4, range 30/120 ft. Hit: 5 (1d6+2) Piercing plus 7 (2d6) Poison damage."
bonus_actions:
  - name: Cunning Action
    desc: "The spy takes the Dash, Disengage, or Hide action."
```

### Scout (CR 1/2)
```statblock
layout: Basic 5e Layout
name: Scout
size: Medium
type: humanoid
alignment: neutral
ac: 13
hp: 16
hit_dice: 3d8+3
speed: 30 ft.
stats: [11, 14, 12, 11, 13, 11]
skillsaves:
  - nature: 4
  - perception: 5
  - stealth: 6
  - survival: 5
senses: "passive Perception 15"
languages: "Common plus one other language"
cr: "1/2"
actions:
  - name: Multiattack
    desc: "The scout makes two attacks, using Shortsword and Longbow in any combination."
  - name: Shortsword
    desc: "Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6+2) Piercing damage."
  - name: Longbow
    desc: "Ranged Attack Roll: +4, range 150/600 ft. Hit: 6 (1d8+2) Piercing damage."
```

### Wereraven — Keepers of the Feather (CR 2)
```statblock
layout: Basic 5e Layout
name: Wereraven (Keeper of the Feather)
size: Medium
type: monstrosity
alignment: lawful good
ac: 12
hp: 31
hit_dice: 7d8
speed: 30 ft. (fly 50 ft. in raven or hybrid form)
stats: [10, 16, 12, 13, 14, 15]
skillsaves:
  - insight: 4
  - perception: 6
damage_immunities: "Bludgeoning, Piercing, Slashing from nonmagical attacks not made with silvered weapons"
senses: "passive Perception 16"
languages: "Common (can't speak in raven form)"
cr: 2
traits:
  - name: Shapechanger
    desc: "Can shift between Humanoid, raven, and hybrid forms as a Bonus Action. Stats stay the same; can't speak in raven form; reverts on death."
  - name: Mimicry
    desc: "Can mimic simple sounds it has heard (DC 12 Insight to discern the trick)."
actions:
  - name: Multiattack
    desc: "The wereraven makes two attacks, only one of which can be a beak attack."
  - name: Beak (raven or hybrid only)
    desc: "Melee Attack Roll: +5, reach 5 ft. Hit: 8 (2d4+3) Piercing damage."
  - name: Shortsword (humanoid or hybrid only)
    desc: "Melee Attack Roll: +5, reach 5 ft. Hit: 6 (1d6+3) Piercing damage."
```

---

> [!warning] Accuracy notes (2024)
> - **Vampire Spawn (2024):** AC 16, HP 90, **no Regeneration** — its weakness is **Sunlight** (20 Radiant if it starts its turn in sunlight), Running Water, Stake, and **Forbiddance** (can't enter a *residence* uninvited — a public church does **not** count, so the siege works). Radiant still matters: Sunlight Hypersensitivity + undead.
> - **Regeneration** only appears on the **Nosferatu** and the **Unspeakable Horror** — radiant damage shuts the Nosferatu's off for a turn.
> - **Minotaur Skeleton (2024):** HP 45, **Vulnerable to Bludgeoning** — maces and hammers wreck it.

## Links
[[Encounters & Stat Blocks]] · [[Bad Blood — Overview]] · [[NPC Index]]

#dnd #ravenloft #reference #bestiary
