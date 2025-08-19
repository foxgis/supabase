import { describe, expect, it, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { addAPIMock } from 'tests/lib/msw'
import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'

import { render } from 'tests/helpers'
import { routerMock } from 'tests/lib/route-mock'
import CreateBucketModal from '../CreateBucketModal'

describe(`CreateBucketModal`, () => {
  beforeEach(() => {
    vi.mock(`hooks/misc/useCheckPermissions`, () => ({
      useCheckPermissions: vi.fn(),
      useAsyncCheckProjectPermissions: vi.fn().mockImplementation(() => ({ can: true })),
    }))
    // useParams
    routerMock.setCurrentUrl(`/project/default/storage/buckets`)
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
    // useBucketCreateMutation
    addAPIMock({
      method: `post`,
      path: `/platform/storage/:ref/buckets`,
    })
  })

  it(`renders a dialog with a form`, async () => {
    render(
      <ProjectContextProvider projectRef="default">
        <CreateBucketModal />
      </ProjectContextProvider>
    )

    const dialogTrigger = screen.getByRole(`button`, { name: `新建存储桶` })
    await userEvent.click(dialogTrigger)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(`存储桶名称`)
    await userEvent.type(nameInput, `test`)

    const standardOption = screen.getByLabelText(`标准存储桶`)
    await userEvent.click(standardOption)

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

    const submitButton = screen.getByRole(`button`, { name: `创建` })

    fireEvent.click(submitButton)

    await waitFor(() =>
      expect(routerMock.asPath).toStrictEqual(`/project/default/storage/buckets/test`)
    )
  })
})
