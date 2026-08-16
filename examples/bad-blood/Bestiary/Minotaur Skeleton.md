# Minotaur Skeleton

> [!infobox]+
> ![[Minotaur Skeleton.webp]]
>
*Tavern backup. Hammers wreck it.*

Large undead · lawful evil · CR 2

| | |
|---|---|
| **CR** | 2 |
| **Role** | Sorvina's muscle |
| **Source** | MM 2024 |

## Notes

Optional Blood o' the Vine fight. Vulnerable to bludgeoning. Open with Gore after a 20-ft charge (extra damage and Prone), then Slam.

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
damage_immunities: "Poison"
condition_immunities: "Exhaustion, Poisoned"
senses: "Darkvision 60 ft., passive Perception 9"
languages: "Understands Abyssal but can't speak"
cr: 2
traits:
  - name: Unusual Nature
    desc: "Vulnerable to bludgeoning damage."
actions:
  - name: Gore
    desc: "+6 to hit, reach 5 ft. Hit: 11 (2d6+4) piercing. If the target is Large or smaller and the skeleton moved 20 ft. straight toward it, add 9 (2d8) piercing and the target is Prone."
  - name: Slam
    desc: "+6 to hit, reach 5 ft. Hit: 15 (2d10+4) bludgeoning."
```
