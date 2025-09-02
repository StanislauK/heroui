import { Link } from "@heroui/link";
import { useLocation } from "react-router-dom";
import { HomeIcon, DocumentIcon, CreditCardIcon } from "@/components/icons";

export const BottomNavigation = () => {
  const location = useLocation();
  
  const tabs = [
    {
      id: "/",
      label: "Заведения",
      icon: <HomeIcon className="w-5 h-5" />,
      href: "/",
    },
    {
      id: "/cart",
      label: "Корзина",
      icon: <DocumentIcon className="w-5 h-5" />,
      href: "/cart",
    },
    {
      id: "/orders",
      label: "Заказы",
      icon: <CreditCardIcon className="w-5 h-5" />,
      href: "/orders",
    },
    {
        id: "/test",
        label: "Test",
        icon: <CreditCardIcon className="w-5 h-5" />,
        href: "/test",
      },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-divider lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center gap-1 text-xs transition-all duration-200 ${
                isActive 
                  ? "text-primary scale-110" 
                  : "text-foreground hover:text-primary hover:scale-105"
              }`}
              color="foreground"
            >
              <div className={`p-2 rounded-lg transition-colors ${
                isActive 
                  ? "bg-primary/10" 
                  : "hover:bg-default-100"
              }`}>
                {tab.icon}
              </div>
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
