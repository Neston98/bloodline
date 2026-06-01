interface PageHeaderProps {
  greeting: string
  date: string
}

export function PageHeader({ greeting, date }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-black">{greeting}</h1>
      <p className="mt-1 text-sm text-gray-900">{date}</p>
    </div>
  )
}
