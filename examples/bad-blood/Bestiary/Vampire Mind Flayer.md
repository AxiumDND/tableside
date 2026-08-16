# Vampire Mind Flayer

> [!infobox]+
> ![[Vampire Mind Flayer.webp]]
>
*The prototype. Mind Burst goes up as well as out.*

Medium undead · chaotic evil · CR 5

| | |
|---|---|
| **CR** | 5 |
| **Role** | Wave 3 spike · Session 3 Trap |
| **Source** | Custom |

## Notes

Mind Burst is a 30-ft emanation that extends vertically — gallery snipers are in range. Climb 30 ft.; it comes up the nave wall. Telegraph every time: tentacles flare, pressure behind the eyes. Radiant wrecks it — 20 if it starts its turn in Dawnlight. Session 3 runs two of them with Lyssa.

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
    desc: "Climbs difficult surfaces, including ceilings, without an ability check. Pursues elevated targets."
  - name: Sunlight Hypersensitivity
    desc: "Takes 20 radiant if it starts its turn in sunlight. Disadvantage on attacks and checks in sunlight."
actions:
  - name: Multiattack
    desc: "Two Claws, or one Claw and one Tentacles, and uses Mind Burst if available."
  - name: Claw
    desc: "+7 to hit, reach 5 ft. Hit: 8 (1d8+4) slashing plus 10 (3d6) necrotic."
  - name: Tentacles
    desc: "+7 to hit, reach 5 ft. Hit: 11 (2d6+4) piercing. If the target is Medium or smaller, it is Grappled (escape DC 14)."
  - name: Drink Sapience
    desc: "DC 15 Wis save, one Grappled creature. Failure: 21 (6d6) psychic, 1 Exhaustion, HP maximum reduced by the damage; the mind flayer regains that many HP."
  - name: Mind Burst (Recharge 6)
    desc: "DC 15 Int save, each creature in a 30-foot Emanation (extends vertically). Failure: Incapacitated; repeat the save at the end of each turn. Ends automatically after 1 minute."
```
