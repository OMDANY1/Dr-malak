"use client";

import React, { createContext, useContext } from "react";
import { PublicCmsSnapshot } from "@/lib/cms/types";

const CmsSnapshotContext = createContext<PublicCmsSnapshot | null>(null);

export function CmsSnapshotProvider({
  snapshot,
  children,
}: {
  snapshot: PublicCmsSnapshot;
  children: React.ReactNode;
}) {
  return (
    <CmsSnapshotContext.Provider value={snapshot}>
      {children}
    </CmsSnapshotContext.Provider>
  );
}

export function useCmsSnapshot(): PublicCmsSnapshot | null {
  return useContext(CmsSnapshotContext);
}
