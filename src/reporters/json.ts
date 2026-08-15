import type { RunReport } from '../domain/report.js'
import { RunReportSchema } from '../domain/report.js'

export function renderJson(report: RunReport): string {
  return `${JSON.stringify(RunReportSchema.parse(report), null, 2)}\n`
}
