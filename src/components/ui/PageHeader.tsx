type PageHeaderProps = {
  title: string
  description?: string
}

function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">{title}</h2>

      {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
    </section>
  )
}

export default PageHeader
