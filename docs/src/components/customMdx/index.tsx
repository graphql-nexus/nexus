import React from 'react'
import CodeBlock from './codeBlock'
import TabbedContent from './tabbedContent'
import ParallelBlocks from './parallelBlocks'
import CodeWithResult from './codeWithResult'
import Code from './code'
import CollapseBox from './collapsible'
import Table from './table'
import ButtonLink from './button'
import FileWithIcon from './fileWithIcon'
import Subsections from './subSections'
import TopBlock from './topBlock'

export default {
  h1: () => <h1 style={{ display: 'none' }} />,
  p: (props: any) => <p className="paragraph" {...props} />,
  ul: (props: any) => <ul className="list" {...props} />,
  ol: (props: any) => <ol className="o-list" {...props} />,
  CodeBlock,
  TabbedContent,
  ParallelBlocks,
  CodeWithResult,
  FileWithIcon,
  inlineCode: (props: any) => <code className="inline-code" {...props} />,
  code: Code,
  details: CollapseBox,
  table: Table,
  ButtonLink,
  Subsections,
  TopBlock,
  img: (props: any) => (
    <a href={props.src} target="_blank">
      <img {...props} />
    </a>
  ),
}
