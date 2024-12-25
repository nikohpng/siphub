export const AppEnv = {
    DBUser: process.env.DBUser ?? 'root',
    DBPasswd: process.env.DBPasswd ?? 'V19Z1N9!j4d3Ww',
    DBAddr: process.env.DBAddr ?? '192.168.77.16',
    DBPort: process.env.DBPort ? parseInt(process.env.DBPort) : 3306,
    DBName: process.env.DBName ?? 'sips',
    LogLevel: process.env.LogLevel ?? 'debug',
    QueryLimit: process.env.QueryLimit ? parseInt(process.env.QueryLimit) : 10,
    cronTime: process.env.cronTime ?? '0 0 0 * * *',
    timeZone: process.env.timeZone ?? 'Asia/Shanghai',
    enableCron: process.env.enableCron ?? 'yes',
    dataKeepDays: process.env.dataKeepDays ? parseInt(process.env.dataKeepDays) : 3
}