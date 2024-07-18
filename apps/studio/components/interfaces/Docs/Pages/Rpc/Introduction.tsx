const Introduction = () => {
  return (
    <>
      <h2 className="doc-heading">概述</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            数据库上所有存储过程都可以通过 API 访问。这意味着您可以直接在数据库中构建您的逻辑（如果你足够勇敢！）
          </p>
          <p>API 接口支持通过 POST（在某些情况下 GET）方法执行函数。</p>
        </article>
      </div>
    </>
  )
}

export default Introduction
