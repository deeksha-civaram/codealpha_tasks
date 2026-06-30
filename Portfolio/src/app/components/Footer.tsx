import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          Built with <Heart className="h-4 w-4 text-primary fill-primary" /> by Civaram VijayKumar Deeksha
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          © 2026 All rights reserved.
        </p>
      </div>
    </footer>
  );
}
