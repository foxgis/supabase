import { describe, expect, it, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { faker } from '@faker-js/faker'

import { addAPIMock } from 'tests/lib/msw'
import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { Bucket } from 'data/storage/buckets-query'
import { render } from 'tests/helpers'
import EditBucketModal from '../EditBucketModal'

const bucket: Bucket = {
  id: faker.string.uuid(),
  name: `test`,
  owner: faker.string.uuid(),
  public: false,
  allowed_mime_types: [],
  file_size_limit: undefined,
  type: 'STANDARD',
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
}

const Page = ({ onClose }: { onClose: () => void }) => {
  const [open, setOpen] = useState(false)
  return (
    <ProjectContextProvider projectRef="default">
      <button onClick={() => setOpen(true)}>打开</button>

      <EditBucketModal
        visible={open}
        bucket={bucket}
        onClose={() => {
          setOpen(false)
          onClose()
        }}
      />
    </ProjectContextProvider>
  )
}

describe(`EditBucketModal`, () => {
  beforeEach(() => {
    // useSelectedProject -> Project
    addAPIMock({
      method: `get`,
      path: `/platform/projects/:ref`,
      // @ts-expect-error
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })
    // useBucketUpdateMutation
    addAPIMock({
      method: `patch`,
      path: `/platform/storage/:ref/buckets/:id`,
    })
  })

  it(`renders a dialog with a form`, async () => {
    const onClose = vi.fn()
    render(<Page onClose={onClose} />)

    const openButton = screen.getByRole(`button`, { name: `打开` })
    await userEvent.click(openButton)
    await screen.findByRole(`dialog`)

    const nameInput = screen.getByLabelText(`存储桶名称`)
    expect(nameInput).toHaveValue(`test`)
    expect(nameInput).toBeDisabled()

    const publicToggle = screen.getByLabelText(`公开存储桶`)
    expect(publicToggle).not.toBeChecked()
    await userEvent.click(publicToggle)
    expect(publicToggle).toBeChecked()

    const detailsTrigger = screen.getByRole(`button`, { name: `其他配置` })
    expect(detailsTrigger).toHaveAttribute(`data-state`, `closed`)
    await userEvent.click(detailsTrigger)
    expect(detailsTrigger).toHaveAttribute(`data-state`, `open`)

    const sizeLimitToggle = screen.getByLabelText(`限制存储桶上传文件的大小`)
    expect(sizeLimitToggle).not.toBeChecked()
    await userEvent.click(sizeLimitToggle)
    expect(sizeLimitToggle).toBeChecked()

    const sizeLimitInput = screen.getByLabelText(`文件大小限制`)
    expect(sizeLimitInput).toHaveValue(0)
    await userEvent.type(sizeLimitInput, `25`)

    const sizeLimitUnitSelect = screen.getByLabelText(`文件大小限制的单位`)
    expect(sizeLimitUnitSelect).toHaveTextContent(`字节`)
    await userEvent.click(sizeLimitUnitSelect)
    const mbOption = screen.getByRole(`option`, { name: `MB` })
    await userEvent.click(mbOption)
    expect(sizeLimitUnitSelect).toHaveTextContent(`MB`)

    const mimeTypeInput = screen.getByLabelText(`允许的 MIME 类型`)
    expect(mimeTypeInput).toHaveValue(``)
    await userEvent.type(mimeTypeInput, `image/jpeg, image/png`)

    const confirmButton = screen.getByRole(`button`, { name: `保存` })

    fireEvent.click(confirmButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
