import InformationBox from 'components/ui/InformationBox'
import { AlertCircle } from 'lucide-react'

interface NotFoundStateProps {
  id: string | number
}

const NotFoundState = ({ id }: NotFoundStateProps) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-[400px]">
        <InformationBox
          icon={<AlertCircle strokeWidth={2} />}
          title={`无法找到 ID 为 ${id} 的表`}
        />
      </div>
    </div>
  )
}

export default NotFoundState
