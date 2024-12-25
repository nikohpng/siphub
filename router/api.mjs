import { Router } from "express"
import { logger } from "../logger.mjs"
import { queryRecord, queryById } from "../db.mjs"
import { table } from "console"
import { createSeqHtml } from "../util.mjs"

export const route = Router()

route.post('/record', async (req, res) => {
    await queryRecord(req.body, function (re) {
        res.render('home/sipcdr', { table: re})
    })
})

route.get('/call', async (req, res) => {
    await queryById(req.query.id, req.query.day, function (rows) {
        let seq = createSeqHtml(rows)
        logger.debug(seq)

        res.render('diagram/index', {
            seq: seq.html, table: rows
        })
    })
})

