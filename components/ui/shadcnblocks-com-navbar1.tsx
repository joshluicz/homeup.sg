"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Building2, Home, Menu, Sparkles, Trees } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/Button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: ReactNode;
  items?: MenuItem[];
}

interface Navbar1Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  logoSlot?: ReactNode;
  menu?: MenuItem[];
  mobileExtraLinks?: {
    name: string;
    url: string;
  }[];
  auth?: {
    login?: {
      text: string;
      url: string;
    };
    signup?: {
      text: string;
      url: string;
      icon?: ReactNode;
    };
  };
  className?: string;
}

function NavLink({
  href,
  className,
  children,
  external,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  external?: boolean;
}) {
  const isExternal = external ?? href.startsWith("http");

  if (isExternal) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

const Navbar1 = ({
  logo = {
    url: "https://www.shadcnblocks.com",
    src: "https://www.shadcnblocks.com/images/block/block-1.svg",
    alt: "logo",
    title: "Shadcnblocks.com",
  },
  logoSlot,
  menu = [
    { title: "Home", url: "#" },
    {
      title: "Products",
      url: "#",
      items: [
        {
          title: "Blog",
          description: "The latest industry news, updates, and info",
          icon: <Home className="size-5 shrink-0" />,
          url: "#",
        },
      ],
    },
  ],
  mobileExtraLinks = [],
  auth,
  className,
}: Navbar1Props) => {
  const showLogin = Boolean(auth?.login?.text);
  const showSignup = Boolean(auth?.signup?.text);

  return (
    <section className={cn("py-4", className)}>
      <div className="container-page">
        <nav className="hidden justify-between lg:flex" aria-label="Primary navigation">
          <div className="flex items-center gap-6">
            {logoSlot ?? (
              <NavLink href={logo.url} className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.src} className="h-8 w-auto" alt={logo.alt} />
                <span className="text-lg font-semibold">{logo.title}</span>
              </NavLink>
            )}
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          {(showLogin || showSignup) && (
            <div className="flex gap-2">
              {showLogin && auth?.login && (
                <Button asChild variant="outline" size="sm">
                  <NavLink href={auth.login.url}>{auth.login.text}</NavLink>
                </Button>
              )}
              {showSignup && auth?.signup && (
                <Button asChild size="sm">
                  <NavLink href={auth.signup.url} external={auth.signup.url.startsWith("http")} className="gap-2">
                    {auth.signup.icon}
                    {auth.signup.text}
                  </NavLink>
                </Button>
              )}
            </div>
          )}
        </nav>

        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            {logoSlot ?? (
              <NavLink href={logo.url} className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.src} className="h-8 w-auto" alt={logo.alt} />
                <span className="text-lg font-semibold">{logo.title}</span>
              </NavLink>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    {logoSlot ?? (
                      <NavLink href={logo.url} className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo.src} className="h-8 w-auto" alt={logo.alt} />
                        <span className="text-lg font-semibold">{logo.title}</span>
                      </NavLink>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <div className="my-6 flex flex-col gap-6">
                  <Accordion type="single" collapsible className="flex w-full flex-col gap-4">
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                  {mobileExtraLinks.length > 0 && (
                    <div className="border-t py-4">
                      <div className="grid grid-cols-2 justify-start">
                        {mobileExtraLinks.map((link) => (
                          <NavLink
                            key={link.name}
                            href={link.url}
                            className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
                          >
                            {link.name}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                  {(showLogin || showSignup) && (
                    <div className="flex flex-col gap-3">
                      {showLogin && auth?.login && (
                        <Button asChild variant="outline">
                          <NavLink href={auth.login.url}>{auth.login.text}</NavLink>
                        </Button>
                      )}
                      {showSignup && auth?.signup && (
                        <Button asChild>
                          <NavLink
                            href={auth.signup.url}
                            external={auth.signup.url.startsWith("http")}
                            className="gap-2"
                          >
                            {auth.signup.icon}
                            {auth.signup.text}
                          </NavLink>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

function renderMenuItem(item: MenuItem) {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger className="text-muted-foreground">
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="w-80 p-3">
            {item.items.map((subItem) => (
              <li key={subItem.title}>
                <NavigationMenuLink asChild>
                  <NavLink
                    href={subItem.url}
                    className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                  >
                    {subItem.icon}
                    <div>
                      <div className="text-sm font-semibold">{subItem.title}</div>
                      {subItem.description && (
                        <p className="text-sm leading-snug text-muted-foreground">
                          {subItem.description}
                        </p>
                      )}
                    </div>
                  </NavLink>
                </NavigationMenuLink>
              </li>
            ))}
            <li className="mt-1 border-t pt-2">
              <NavigationMenuLink asChild>
                <NavLink
                  href={item.url}
                  className={cn(navigationMenuTriggerStyle(), "w-full justify-start")}
                >
                  View all {item.title.toLowerCase()} →
                </NavLink>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink asChild>
        <NavLink
          href={item.url}
          className={cn(
            navigationMenuTriggerStyle(),
            "text-muted-foreground hover:text-accent-foreground",
          )}
        >
          {item.title}
        </NavLink>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
}

function renderMobileMenuItem(item: MenuItem) {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <NavLink
              key={subItem.title}
              href={subItem.url}
              className="flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
            >
              {subItem.icon}
              <div>
                <div className="text-sm font-semibold">{subItem.title}</div>
                {subItem.description && (
                  <p className="text-sm leading-snug text-muted-foreground">
                    {subItem.description}
                  </p>
                )}
              </div>
            </NavLink>
          ))}
          <NavLink href={item.url} className="mt-2 block px-3 text-sm font-semibold text-primary-600">
            View all {item.title.toLowerCase()} →
          </NavLink>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <NavLink key={item.title} href={item.url} className="font-semibold">
      {item.title}
    </NavLink>
  );
}

export { Navbar1, type MenuItem, type Navbar1Props };
