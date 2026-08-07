# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Arrows now occupy a run of one to three cells rather than a single tile, with
  the head at the tip and the shaft drawn along the whole piece. Length is
  information the player reads off the board without counting tiles, and a long
  piece is an obstacle with real extent — clearing one can open a lane for
  several others at once.
- Tests for the movement rule and the generator, including the property that
  matters: every generated board is played through its solution and must clear.
  A board that cannot be finished is indistinguishable, to a player, from one
  they merely have not solved yet.

### Changed

- Storage moves to `arrows:v3`. A saved board used to be a flat array of one
  direction per cell and is now a list of pieces, so the old shape cannot be
  read as the new one. The current level and the cleared/clean records carry
  across from `arrows:v2`; an in-progress board does not.
- The generator places pieces by drawn length rather than folding length into
  the placement search, which would have made every board uniformly long.

### Fixed

- This repository exists. The deployed game had no source anywhere — no repo, no
  local directory, no git metadata on the deployment — and could not have been
  rebuilt or recovered. It is reconstructed here from the deployed bundle:
  faithful in behaviour, rewritten to be readable and tested.
