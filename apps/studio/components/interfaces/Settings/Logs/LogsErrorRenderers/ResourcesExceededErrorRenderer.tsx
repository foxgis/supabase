import { Accordion, Input } from 'ui'
import { ErrorRendererProps } from './DefaultErrorRenderer'

const ResourcesExceededErrorRenderer: React.FC<ErrorRendererProps> = ({ error, isCustomQuery }) => (
  <div className="flex flex-col gap-2 text-foreground-light">
    <div className="flex flex-col gap-1 text-sm">
      <p>此查询需要太多内存才能执行。</p>
      <p>
        {isCustomQuery
          ? '避免选择整个对象，而是使用点表示法选择特定的键。'
          : '避免跨大时间范围的查询。'}
      </p>
      {!isCustomQuery && <p>如果此错误持续存在，请联系支持。</p>}
    </div>
    <Accordion
      className="text-sm"
      justified={false}
      openBehaviour="multiple"
      type="default"
      chevronAlign="left"
      size="small"
      iconPosition="left"
    >
      <Accordion.Item id="1" header="完整的错误消息">
        <Input.TextArea
          size="tiny"
          value={JSON.stringify(error, null, 2)}
          borderless
          className="mt-4 w-full font-mono"
          copy
          rows={5}
        />
      </Accordion.Item>
    </Accordion>
  </div>
)

export default ResourcesExceededErrorRenderer
