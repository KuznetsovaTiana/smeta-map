import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { useNodeContent } from '../src/hooks/useNodeContent.ts'
import { useDocument } from '../src/hooks/useDocument.ts'
import { useContentQuery } from '../src/hooks/useContentQuery.ts'
import { contentRepository } from '../src/services/contentRepositoryInstance.ts'

// SSR-проверка реальных хуков без DOM-зависимостей. Эффекты и их отмена
// проверяются отдельно через тот же createContentRequest, который используют хуки.
test('хуки возвращают loading без старых data ещё до запуска эффектов', () => {
  function Probe({ regionId }: { regionId: string }) {
    const node = useNodeContent({ kind: 'process', id: 'design' }, regionId, contentRepository)
    const document = useDocument('moscow-design-p-vor-document', regionId)
    const structure = useContentQuery({ kind: 'structure', regionId })
    const catalog = useContentQuery({ kind: 'catalog', regionId })
    for (const state of [node, document, structure, catalog]) {
      assert.equal(state.status, 'loading')
      assert.equal(state.loading, true)
      assert.equal('data' in state, false)
      assert.equal(typeof state.reload, 'function')
    }
    return createElement('span', null, regionId)
  }
  assert.equal(renderToString(createElement(Probe, { regionId: 'moscow' })), '<span>moscow</span>')
  assert.equal(renderToString(createElement(Probe, { regionId: 'regions' })), '<span>regions</span>')
})
