import assert from 'node:assert/strict'
import test from 'node:test'
import { contentRepository } from '../src/services/contentRepositoryInstance.ts'
import { documentPath, matchesContentRoute, nodePath, nodeReference, regionChangePath, regionalLocation } from '../src/utils/contentRoutes.ts'

test('канонические пути и цепочки родителей операции П и прямой операции сноса', async () => {
  for (const id of ['design-p-vor', 'demolition-local-estimate']) {
    const result = await contentRepository.getOperation(id, 'moscow')
    assert.equal(result.status, 'success')
    if (result.status !== 'success') throw new Error('Нет операции')
    const chain = [...result.data.ancestors, result.data.node]
    const params = id === 'design-p-vor' ? { processId: 'design', blockId: 'design-p', operationId: id } : { processId: 'demolition', operationId: id }
    assert.equal(matchesContentRoute(chain, params), true)
    assert.equal(matchesContentRoute(chain, { ...params, processId: 'construction' }), false)
    assert.equal(nodeReference(params)?.id, id)
    assert.ok(nodePath(chain).endsWith(`/operations/${id}`))
    const path = documentPath(chain, `moscow-${id}-document`)
    assert.equal(regionChangePath(path), nodePath(chain))
  }
})

test('регион сохраняется в ссылках, смена региона документа возвращает к владельцу', () => {
  assert.deepEqual(regionalLocation('/schema', 'regions'), { pathname: '/schema', search: '?region=regions' })
  assert.equal(regionChangePath('/documents/old-document'), '/documents')
  assert.equal(regionChangePath('/schema/processes/design/blocks/design-r'), '/schema/processes/design/blocks/design-r')
  assert.equal(nodePath([]), '/schema')
  assert.equal(nodeReference({}), null)
})
