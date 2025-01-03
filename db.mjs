// import pg from 'pg'
import mysql from 'mysql'
import { AppEnv } from './env.mjs'
import { logger } from './logger.mjs'
import { whereBuilder } from './util.mjs'
import dayjs from 'dayjs'

// const pool = new Pool({
//     user: AppEnv.DBUser,
//     password: AppEnv.DBPasswd,
//     host: AppEnv.DBAddr,
//     port: AppEnv.DBPort,
//     database: AppEnv.DBName,
//     idleTimeoutMillis: 30000,
//     max: 20,
//     connectionTimeoutMillis: 2000,
// })

const pool = mysql.createConnection({
        host: AppEnv.DBAddr,
        user: AppEnv.DBUser,
        password: AppEnv.DBPasswd,
        database: AppEnv.DBName
    })
pool.connect();

function getTableNameByDay(day) {
    let today = dayjs().format('YYYY-MM-DD')
    if (day === today) {
        return 'records'
    }

    return `records_${day.replaceAll('-', '')}`
}

export async function tableSplit() {
    let tableDay = dayjs().subtract(1, 'day').format("YYYYMMDD")

    const sql = `
        CREATE table if not exists records_tmp (LIKE public.records INCLUDING all);
        ALTER TABLE records RENAME TO records_${tableDay};
        ALTER TABLE records_tmp RENAME TO records;
    `

    logger.info(sql)

    pool.query(sql)
}

export async function deleteTable() {
    let res = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' and 
        table_name like 'records_%' 
        order by table_name desc 
        offset ${AppEnv.dataKeepDays};
    `)

    if (res.rows.length === 0) {
        logger.info("没有需要删除的表")
    }

    for (const ele of res.rows) {
        console.log(ele.table_name)
        logger.info(`try delete table ${ele.table_name}`)
        await pool.query(`DROP TABLE IF EXISTS ${ele.table_name}`)
    }
}

export async function queryRecord(c, cb) {
    logger.info(c)
    let wh = whereBuilder(c)
    const sql = `
      select
        sip_call_id as "CallID",
        date_format(min(create_time),'%H:%i:%s') as "startTime",
        date_format(min(create_time),'%Y-%m-%d') as "day",
        date_format(max(create_time),'%H:%i:%s') as "stopTime",
        date_format(max(create_time) - min(create_time),'%H:%i:%s') as "duration",
        min(from_user) as "caller",
        min(to_user) as "callee",
        count(*) as "msgTotal",
        min(user_agent) as "UA",
        max(response_code) as "finalCode",
        GROUP_CONCAT(DISTINCT CASE WHEN response_code BETWEEN 170 AND 190 THEN response_code END, ',') AS "tempCode"
    from
        ${getTableNameByDay(c.day)}
    where
        ${wh.join(' and ')}
    group by sip_call_id 
    having count(*) >= ${c.msg_min}
    order by "startTime" desc
    limit ${AppEnv.QueryLimit}
    `

    logger.info(sql)
    await pool.query(sql, function (err, rs) {
        if (err) {
            logger.error(`query err: ${err}`)
            cb([])
            return
        }
        cb(rs)
    })
}


export async function queryById(id, day, cb) {
    const sql = `
    select
    sip_call_id,
	sip_method,
	date_format(create_time,
	'%Y-%M-%d') as create_time,
	timestamp_micro,
	raw_msg,
    cseq_number,
	case 
		when sip_protocol = 6 then 'TCP'
		when sip_protocol = 17 then 'UDP'
		when sip_protocol = 22 then 'TLS'
		when sip_protocol = 50 then 'ESP'
		else 'Unknown'
	end as sip_protocl,
	replace(src_host,':','_') as src_host,
	replace(dst_host,':','_') as dst_host,
    response_desc,
    length(raw_msg) as msg_len
    from
        ${getTableNameByDay(day)}
    where
        sip_call_id = '${id}'
    order by create_time, timestamp_micro ASC 
    `

    logger.info(sql)
    await pool.query(sql, function (err, rs) {
        if (err) {
            logger.error(`query err: ${err}`)
            cb(null)
            return
        }
        cb(rs)
    })
}