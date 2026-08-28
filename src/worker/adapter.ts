import type { StageCompletion } from '../domain/lifecycle.js'
import type {
  Assertion,
  ObserverCoverageItem,
  SubjectIdentity,
} from '../domain/report.js'
import type { WorkerRequest } from './protocol.js'

export interface ProbeArtifact {
  assertions: Assertion[]
  exercises: Assertion[]
  routes?: Assertion[]
  browser?: Assertion[]
}

export interface AdapterBootObservation {
  outcome: 'success' | 'failure' | 'crash'
  probe: ProbeArtifact | null
}

export type AdapterCompletion<T> = StageCompletion & { value: T }

export interface ObserverCoverage {
  filesystem: ObserverCoverageItem
  process: ObserverCoverageItem
  ports: ObserverCoverageItem
  network: ObserverCoverageItem
  canary: ObserverCoverageItem
}

export interface LifecycleAdapter {
  initialize?(request: WorkerRequest): Promise<void>
  resolve(): Promise<AdapterCompletion<void>>
  installDsh(): Promise<AdapterCompletion<void>>
  packageSubject(): Promise<AdapterCompletion<void>>
  installPlugin(): Promise<AdapterCompletion<void>>
  assemble(): Promise<AdapterCompletion<void>>
  boot(): Promise<AdapterCompletion<AdapterBootObservation>>
  register(observation: AdapterBootObservation): Promise<AdapterCompletion<void>>
  exercise(observation: AdapterBootObservation): Promise<AdapterCompletion<void>>
  update(): Promise<AdapterCompletion<void>>
  uninstall(): Promise<AdapterCompletion<void>>
  reboot(): Promise<AdapterCompletion<void>>
  recover(): Promise<AdapterCompletion<void>>
  cleanup(): Promise<AdapterCompletion<void>>
  subjectIdentity(): SubjectIdentity
  dshIdentity(): { version: string; integrity: string | null }
  environment(): Record<string, unknown>
  observerCoverage(): ObserverCoverage
  artifacts(): string[]
}
