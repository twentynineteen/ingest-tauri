import { AppSidebar } from '@components/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@components/components/ui/breadcrumb'
import { Separator } from '@components/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@components/components/ui/sidebar'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from 'src/context/AuthProvider'

// The Page component acts as the main provider of layout for this application
// Child components are loaded underneath the header, via the Outlet component

export const Page: React.FC = () => {
  // const [username, setUsername] = useState<string>('')
  // useEffect(() => {
  //   setUsername(username)
  // }, [username])
  const { username } = useAuth()
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="build">Ingest footage</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Build a project</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Page
