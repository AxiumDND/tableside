# *Sorvina*

> [!infobox]+
> ![[Sorvina.webp]]
>
> ### *The Horror · youngest sister · the source*
>
> | | |
> |---|---|
> | **Ancestry** | Was human; now an Unspeakable Horror |
> | **Role** | Tavern final boss — buried temple *(backup only)* |
> | **Faction** | Was co-owner of the Blood of the Vine |
> | **Location** | Temple of Ravenkind beneath the tavern |
> | **Status** | Hostile — only if they enter the tavern |
> | **CR** | 8 |

*The curious youngest sister who found the hollow and dug too deep. Now a many-limbed horror chanting over the black bones, raising them against intruders.*

## Look & voice

- **Look** — Huge, wrong, more-than-human. Her face splits into something that was never a smile.
- **Manner** — Too far gone to reason with. For a gut-punch, let one human word slip mid-fight.
- **Quote** — *"…it's so much quieter now."*

> [!gmonly]
> On noticing them she howls and raises the black bones as a [[Minotaur Skeleton]]; both fight to the death. Attacks against her have Disadvantage (Incomprehensible Form); regenerates 10/turn; Terrifying Aura 15 ft. Frightens *and* Paralyzes (DC 15 Wis).
>
> When the skeleton falls (or a PC touches the bones), the bound spirit whispers — [[Rewards & Leveling]] for the Dark Gift. Full tactics in [[Tavern — Blood o' the Vine (Backup)]].

## Notes

Cut content. In play only if the party goes into the tavern. Lyssa's agent steered her to the dig; they were experiments, and collateral.

## Combat

**Combatants:** [[Sorvina]] · [[Minotaur Skeleton]] · party

```statblock
layout: Basic 5e Layout
name: Sorvina
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
    desc: "Attack rolls against the horror have Disadvantage. Suppressed while Incapacitated."
  - name: Regeneration
    desc: "Regains 10 HP at the start of each of its turns if it has at least 1 HP."
  - name: Terrifying Aura
    desc: "15-foot emanation. DC 15 Wisdom save, any enemy that starts its turn in the aura. Failure: Frightened until the start of its next turn; while Frightened this way, also Paralyzed. Success: immune for 24 hours."
actions:
  - name: Multiattack
    desc: "Three Phantasmic Assault attacks."
  - name: Phantasmic Assault
    desc: "+8 to hit, reach 5 ft. or range 60 ft. Hit: 14 (4d6) cold, necrotic, poison, or psychic (horror's choice)."
reactions:
  - name: Warp Mind
    desc: "Trigger: a creature she can see within 120 ft. takes Study or makes a Constitution save to keep Concentration. DC 15 Wisdom save. Failure: 7 (2d6) psychic and Stunned until the end of its next turn."
```
