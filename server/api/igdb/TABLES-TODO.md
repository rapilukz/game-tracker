## Database Seeding Order

### Insert Independent Tables

- [x] countries
- [x] company_status
- [x] game_modes
- [x] game_types
- [x] genres
- [x] keywords
- [x] platform_families
- [x] platform_types
- [x] player_perspectives
- [x] themes

### Insert Dependent Tables

- [x] companies (needs countries, company_status)
- [x] platforms (needs platform_families, platform_types)
- [x] game_engines
- [ ] games (needs game_engines, game_modes, game_types)

### Insert Link (Many-to-Many) Tables

- [ ] game_engines_games (needs games, game_engines)
- [ ] game_genres (needs games, genres)
- [ ] game_keywords (needs games, keywords)
- [ ] game_player_perspectives (needs games, player_perspectives)
- [ ] involved_companies (needs companies, games)

### Insert Extras

- [ ] time_to_beat (needs games)

### Backup files

- 1-phase-backup - Contains all tables from "Insert Independent Tables"
- 1.5-phase-backup - All the above + game_engines & platforms & companies from dependent tables
