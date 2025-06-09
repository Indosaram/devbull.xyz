import NextImage, { ImageProps } from 'next/image'

const basePath = process.env.BASE_PATH

const Image = ({ src, ...rest }: ImageProps) => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <NextImage src={`${basePath || ''}${src}`} {...rest} />
  </div>
)

export default Image
