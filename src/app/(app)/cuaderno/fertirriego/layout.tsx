import { FertirriegoSubtabs } from "./(sections)/fertirriego.subtabs"

const FertirriegoLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-4">
    <FertirriegoSubtabs />
    {children}
  </div>
)

export default FertirriegoLayout
