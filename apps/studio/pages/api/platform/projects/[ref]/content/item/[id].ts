import { paths } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import type { UserContent } from 'types'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handlePost(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    case 'PUT':
      return handlePut(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'PUT'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type ResponseData =
  paths['/platform/projects/{ref}/content/item/{id}']['get']['responses']['200']['content']['application/json']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  // Platform specific endpoint
  const snippet = {
    id: '1',
    owner_id: 1,
    name: 'SQL 查询',
    description: '',
    type: 'sql' as const,
    visibility: 'user' as const,
    content: {
      content_id: '1.0',
      sql: `select * from
  (select version()) as version,
  (select current_setting('server_version_num')) as version_number;`,
      schema_version: '1',
      favorite: false,
    } as any,
    favorite: false,
    inserted_at: '',
    project_id: 0,
    updated_at: '',
  }

  return res.status(200).json({
    ...snippet,
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  return res.status(200).json({})
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  return res.status(200).json({})
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  const snippet: UserContent = req.body
  return res.status(200).json({ data: snippet })
}
