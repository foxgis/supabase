import { Badge, Button } from 'ui'

import { BASE_PATH } from 'lib/constants'
import { BookOpen, Github } from 'lucide-react'

interface ClientLibraryProps {
  language: string
  officialSupport?: boolean
  docsUrl?: string
  gitUrl: string
  altIconName?: string
}

const ClientLibrary = ({
  language,
  officialSupport,
  docsUrl,
  gitUrl,
  altIconName,
}: ClientLibraryProps) => {
  return (
    <div className="flex items-start md:space-x-6">
      <img
        src={`${BASE_PATH}/img/libraries/${
          altIconName ? `${altIconName}-icon.svg` : `${language.toLowerCase()}-icon.svg`
        }`}
        alt={`${language} logo`}
        width="21"
        className="hidden md:block"
      />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <img
            src={`${BASE_PATH}/img/libraries/${
              altIconName ? `${altIconName}-icon.svg` : `${language.toLowerCase()}-icon.svg`
            }`}
            alt={`${language} logo`}
            width="21"
            className="block md:hidden"
          />
          <h5 className="flex items-center gap-2 text-base text-foreground">
            {language} {!officialSupport && <Badge variant="brand">Community</Badge>}
          </h5>
        </div>
        <div className="flex gap-2">
          {docsUrl && (
            <a href={docsUrl} target="_blank" rel="noreferrer">
              <Button icon={<BookOpen />} type="default">
                文档
              </Button>
            </a>
          )}
          <a href={gitUrl} target="_blank" rel="noreferrer">
            <Button icon={<Github />} type="default">
              在 GitHub 上<span className="hidden md:inline">查看</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default ClientLibrary
