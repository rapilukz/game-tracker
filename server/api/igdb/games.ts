import type {
    NewGame,
    NewGameEngineGame,
    NewGameGenre,
    NewGameKeyword,
    NewGameModeGame,
    NewGamePlatform,
    NewGamePlayerPerspective,
    NewGameTheme
} from '~/server/database/schema'
import type { GameData } from '~/server/utils/igdb'

// Services
import { gameService } from '~/server/services/gameService'
import { themesService } from '~/server/services/themesService'
import { gameModeService } from '~/server/services/gameModeService'
import { genreService } from '~/server/services/genreService'
import { platformService } from '~/server/services/platformService'
import { keywordService } from '~/server/services/keywordService'
import { playerPerspectiveService } from '~/server/services/playerPerspectiveService'
import { gameEngineService } from '~/server/services/gameEngineService'

import fs from 'fs/promises'
import path from 'path'

// Used to transform the data from IGDB API to the database schema
type M2MInsertData = {
    game_engines: NewGameEngineGame[]
    game_modes: NewGameModeGame[]
    genres: NewGameGenre[]
    player_perspectives: NewGamePlayerPerspective[]
    themes: NewGameTheme[]
    platforms: NewGamePlatform[]
    keywords: NewGameKeyword[]
}

export default defineEventHandler(async () => {
    const igbd_client = useIGBD()

    let games = await getCachedGames()

    if (!games || Object.keys(games).length <= 0) {
        console.log('No cached games found, fetching from IGDB API...')
        games = await igbd_client.fetchGames()
        await cacheGames(games)
    }

    if (!games.length) {
        throw createError({
            statusCode: 400,
            statusMessage: 'No games found'
        })
    }

    const gamesData: NewGame[] = []
    const m2mGameData: M2MInsertData = {
        game_engines: [],
        game_modes: [],
        genres: [],
        player_perspectives: [],
        themes: [],
        platforms: [],
        keywords: []
    }

    for (const game of games as GameData[]) {
        const transformedDate = game.first_release_date
            ? new Date((game.first_release_date as unknown as number) * 1000) // Convert Unix timestamp to JavaScript Date
            : null

        gamesData.push({
            id: game.id,
            slug: game.slug,
            name: game.name,
            aggregated_rating: game.aggregated_rating,
            rating: game.rating,
            storyline: game.storyline,
            game_type: game.game_type,
            first_release_date: transformedDate
        })

        if (game.themes !== undefined && Array.isArray(game.themes)) {
            game.themes.forEach((theme) => {
                return m2mGameData.themes.push({
                    game_id: game.id as number,
                    theme_id: theme
                })
            })
        }

        if (game.game_modes !== undefined && Array.isArray(game.game_modes)) {
            game.game_modes.forEach((mode) => {
                return m2mGameData.game_modes.push({
                    game_id: game.id as number,
                    game_mode_id: mode
                })
            })
        }

        if (game.genres !== undefined && Array.isArray(game.genres)) {
            game.genres.forEach((genre) => {
                return m2mGameData.genres.push({
                    game_id: game.id as number,
                    genre_id: genre
                })
            })
        }

        if (game.platforms !== undefined && Array.isArray(game.platforms)) {
            game.platforms.forEach((platform) => {
                return m2mGameData.platforms.push({
                    game_id: game.id as number,
                    platform_id: platform
                })
            })
        }

        if (game.keywords !== undefined && Array.isArray(game.keywords)) {
            game.keywords.forEach((keyword) => {
                return m2mGameData.keywords.push({
                    game_id: game.id as number,
                    keyword_id: keyword
                })
            })
        }

        if (game.player_perspectives !== undefined && Array.isArray(game.player_perspectives)) {
            game.player_perspectives.forEach((perspective) => {
                return m2mGameData.player_perspectives.push({
                    game_id: game.id as number,
                    player_perspective_id: perspective
                })
            })
        }

        if (game.game_engines !== undefined && Array.isArray(game.game_engines)) {
            game.game_engines.forEach((engine) => {
                return m2mGameData.game_engines.push({
                    game_id: game.id as number,
                    game_engine_id: engine
                })
            })
        }
    }

    const insertedRecords = await gameService.bulkInsert(gamesData)
    await Promise.all([
        themesService.insertGameThemes(m2mGameData.themes),
        gameModeService.insertGameModesGames(m2mGameData.game_modes),
        genreService.insertGameGenres(m2mGameData.genres),
        platformService.insertGamePlatforms(m2mGameData.platforms),
        keywordService.insertGameKeywords(m2mGameData.keywords),
        playerPerspectiveService.insertGamePlayerPerspectives(m2mGameData.player_perspectives),
        gameEngineService.insertGameEnginesGames(m2mGameData.game_engines)
    ])

    return {
        message: `Inserted ${insertedRecords} games into the database`
    }
})

async function getCachedGames() {
    const CACHE_FILE = path.resolve('cache/igdb_games.json')

    try {
        const file = await fs.readFile(CACHE_FILE, 'utf-8')
        return JSON.parse(file)
    } catch (err) {
        return console.error('Error reading cache file:', err)
    }
}

async function cacheGames(games: NewGame[]) {
    const CACHE_FILE = path.resolve('cache/igdb_games.json')

    try {
        await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
        await fs.writeFile(CACHE_FILE, JSON.stringify(games, null, 2))
        console.log('Games cached successfully')
    } catch (err) {
        console.error('Error writing cache file:', err)
    }
}
