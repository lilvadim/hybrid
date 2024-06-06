import { join } from "path";
import { HYBRID_DIR } from "../config/paths";
import * as log from 'electron-log/main'

const dateTime = new Date(Date.now())

export const UxLog = log.create({ logId: 'ux' })
UxLog.transports.file.level = 'info'
UxLog.transports.file.resolvePathFn = () => 
    join(HYBRID_DIR, 'ux_logs', `ux_${dateTime.getFullYear()}-${dateTime.getMonth()}-${dateTime.getDay()}_T${dateTime.getHours()}-${dateTime.getMinutes()}.log`)
