import React from 'react'
import styled from 'styled-components'
import File from '../../icons/File'
import Display from '../../icons/Display'
import Code from '../../icons/Code'
import Database from '../../icons/Database'

interface FileWithIconProps {
  text: string[]
  icon: keyof typeof icons
}

const icons = {
  file: <File />,
  database: <Database />,
  display: <Display />,
  code: <Code />,
}
const FileNameWrapper = styled.span`
  color: inherit;
  display: inline-flex;
  align-items: center;
  svg {
    margin-right: 8px;
  }
`

const FileWithIcon = ({ icon, text }: FileWithIconProps) => (
  <FileNameWrapper>
    {icons[icon]}
    {text}
  </FileNameWrapper>
)

export default FileWithIcon
