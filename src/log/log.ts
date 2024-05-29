import { join } from "path";
import { HYBRID_DIR } from "../config/paths";
import * as log from 'electron-log/main'

const dateTime = new Date(Date.now())

export const ux = log.create({ logId: 'ux' })
ux.transports.file.level = 'info'
ux.transports.file.resolvePathFn = () => 
    join(HYBRID_DIR, `ux_${dateTime.getFullYear()}-${dateTime.getMonth()}-${dateTime.getDay()}_T${dateTime.getHours()}-${dateTime.getMinutes()}.log`)