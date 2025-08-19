import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { get } from 'data/fetchers'
import { constructHeaders } from 'lib/api/apiHelpers'

const SUPABASE_URL = process.env.SUPABASE_URL

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: false })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  let response: any = await get(`${SUPABASE_URL}/pg_featureserv/collections.json` as any, {
    headers,
  })
  if (response.error) {
    return res.status(400).json(response.error)
  }
  return res.status(200).json(response)
}
