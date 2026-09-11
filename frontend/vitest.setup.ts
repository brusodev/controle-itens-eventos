import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * `isolate: false` (vitest.config.ts) compartilha um único jsdom entre TODOS
 * os arquivos de teste — sem este cleanup explícito, o DOM de um `render()`
 * permanece montado quando o próximo teste (no mesmo arquivo OU em outro)
 * chama `render()` de novo, e consultas globais (`getByText`, `getByLabelText`)
 * passam a enxergar elementos de ambos ao mesmo tempo.
 *
 * Descoberto porque a suíte completa falhava de forma instável em
 * sidebar.test.tsx (labels duplicados, classes trocadas) enquanto cada
 * arquivo, isolado, passava — sintoma clássico de DOM vazando entre testes.
 * @testing-library/react normalmente registra isto sozinho ao ser
 * importado, mas depende de around `afterEach` já existir; aqui fica
 * explícito para não depender dessa ordem de import.
 */
afterEach(() => {
  cleanup()
})
