import React from 'react'

interface Props {
  label: string
  value: React.ReactNode
}

const KeyValueRow: React.FC<Props> = ({ label, value }) => (
  <p>
    <span className="font-medium text-foreground">{label}:</span>{' '}
    <span className="text-muted-foreground">{value}</span>
  </p>
)

export default KeyValueRow
