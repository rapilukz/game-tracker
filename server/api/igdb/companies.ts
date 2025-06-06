import { companyService } from '~/server/services/companyService'

export default defineEventHandler(async () => {
    const igdb_client = useIGBD()
    const companies = await igdb_client.fetchCompanies()

    if (!companies.length) {
        throw createError({
            statusCode: 400,
            statusMessage: 'No companies found'
        })
    }

    const insertedRecords = await companyService.bulkInsert(companies)

    return {
        message: `Inserted ${insertedRecords} companies into the database`
    }
})
