import { Box, Server, Laptop, Key, ScanLine, Database, Cloud, Router, Lock, type LucideIcon } from "lucide-react";

export const RESOURCE_ICONS: Record<string, LucideIcon> = {
  Box,
  Server,
  Laptop,
  Key,
  ScanLine,
  Database,
  Cloud,
  Router,
  Lock,
};

export const RESOURCE_ICON_NAMES = Object.keys(RESOURCE_ICONS);

export const RESOURCE_COLORS = ["blue", "purple", "teal", "amber", "coral", "green", "gray"];
