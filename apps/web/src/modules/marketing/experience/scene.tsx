"use client";

import { Html, MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { ShowroomBrokerage, ShowroomListing } from "./showroom-data";

// ── Layout constants (meters) ────────────────────────────────────────────────
const HALL_HALF_W = 7;
const HALL_H = 6;
const FRONT_Z = 14;
const BACK_Z = -22;
const BAY_DEPTH = 4; // how far an alcove recesses outward
const BAY_HALF_W = 4; // half-width of an alcove along z

export type BayPlacement = {
  brokerage: ShowroomBrokerage;
  side: "left" | "right";
  z: number;
};

/** Distribute brokerages down the corridor, alternating sides. */
export function planBays(brokerages: ShowroomBrokerage[]): BayPlacement[] {
  return brokerages.map((brokerage, i) => ({
    brokerage,
    side: i % 2 === 0 ? "right" : "left",
    z: -1 - i * 7,
  }));
}

export type CameraTarget = { pos: THREE.Vector3; look: THREE.Vector3 };

export const HALL_VIEW: CameraTarget = {
  pos: new THREE.Vector3(0, 2.7, FRONT_Z - 2),
  look: new THREE.Vector3(0, 2.2, -8),
};

export function bayView(bay: BayPlacement): CameraTarget {
  const sign = bay.side === "right" ? 1 : -1;
  return {
    pos: new THREE.Vector3(sign * 3.4, 2.2, bay.z),
    look: new THREE.Vector3(sign * (HALL_HALF_W + BAY_DEPTH), 2.0, bay.z),
  };
}

// ── Camera rig: cinematic drone intro, then eased target navigation ──────────
const INTRO_DURATION = 4.2; // seconds

const INTRO_CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.5, 9, FRONT_Z + 26), // high & far, like a drone approaching
  new THREE.Vector3(-1.2, 5.5, FRONT_Z + 12),
  new THREE.Vector3(0.8, 3.2, FRONT_Z + 4), // dropping toward the entrance
  new THREE.Vector3(0, 2.8, FRONT_Z + 0.2), // through the doorway
  new THREE.Vector3(0, 2.7, FRONT_Z - 2), // settle into the hall view
]);

function easeInOut(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function CameraRig({
  target,
  reduced,
  skipIntro,
}: {
  target: CameraTarget;
  reduced: boolean;
  skipIntro: boolean;
}) {
  const { camera } = useThree();
  const base = useRef(new THREE.Vector3().copy(HALL_VIEW.pos));
  const look = useRef(new THREE.Vector3().copy(HALL_VIEW.look));
  const intro = useRef(0); // 0..1
  const init = useRef(false);

  useFrame((state, delta) => {
    if (!init.current) {
      init.current = true;
      if (reduced || skipIntro) {
        intro.current = 1;
        base.current.copy(target.pos);
        look.current.copy(target.look);
      } else {
        base.current.copy(INTRO_CURVE.getPoint(0));
      }
    }

    const introActive = intro.current < 1 && !reduced && !skipIntro;

    if (introActive) {
      intro.current = Math.min(1, intro.current + delta / INTRO_DURATION);
      const p = INTRO_CURVE.getPoint(easeInOut(intro.current));
      base.current.copy(p);
      look.current.lerp(HALL_VIEW.look, 0.06);
    } else {
      if (intro.current < 1) intro.current = 1;
      const t = reduced ? 1 : 1 - Math.pow(0.0016, delta);
      base.current.lerp(target.pos, t);
      look.current.lerp(target.look, t);
    }

    // Gentle drone hover once we're in the hall (not during a bay close-up).
    const t = state.clock.elapsedTime;
    const isHall = target === HALL_VIEW;
    const floatY = !reduced && isHall && !introActive ? Math.sin(t * 0.55) * 0.12 : 0;
    const floatX = !reduced && isHall && !introActive ? Math.sin(t * 0.32) * 0.18 : 0;

    camera.position.set(base.current.x + floatX, base.current.y + floatY, base.current.z);
    camera.lookAt(look.current);
  });

  return null;
}

// ── A single listing mural rendered as crisp HTML in 3D space ────────────────
function ListingMural({
  listing,
  position,
  rotationY,
  accent,
  onSelect,
}: {
  listing: ShowroomListing;
  position: [number, number, number];
  rotationY: number;
  accent: string;
  onSelect: (l: ShowroomListing) => void;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Physical frame */}
      <RoundedBox args={[2.1, 1.5, 0.08]} radius={0.04} smoothness={3}>
        <meshStandardMaterial color="#0c0c0e" metalness={0.6} roughness={0.35} />
      </RoundedBox>
      <Html
        transform
        distanceFactor={3}
        position={[0, 0, 0.06]}
        occlude={false}
        style={{ pointerEvents: "auto" }}
      >
        <button
          type="button"
          onClick={() => onSelect(listing)}
          className="group/mural"
          style={{
            width: 320,
            height: 230,
            borderRadius: 10,
            overflow: "hidden",
            border: "none",
            cursor: "pointer",
            padding: 0,
            position: "relative",
            background: listing.imageUrl
              ? `center/cover no-repeat url(${listing.imageUrl})`
              : `linear-gradient(155deg, ${accent}55 0%, #2b2f37 45%, #1b1d22 100%)`,
            color: "#fff",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            textAlign: "left",
            boxShadow: `0 0 30px ${accent}44, inset 0 0 60px rgba(255,255,255,0.06)`,
            filter: listing.closed ? "grayscale(0.7) brightness(0.7)" : "none",
          }}
        >
          {!listing.imageUrl && (
            <span
              style={{
                position: "absolute",
                top: 12,
                left: 14,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {listing.city}
            </span>
          )}
          {listing.closed && (
            <span
              style={{
                position: "absolute",
                top: 16,
                right: -34,
                transform: "rotate(35deg)",
                background: "#dc2626",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                padding: "4px 40px",
              }}
            >
              SOLD
            </span>
          )}
          <span
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 55%)",
            }}
          />
          <span style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
            <span style={{ display: "block", fontSize: 20, fontWeight: 700 }}>
              {listing.priceLabel}
            </span>
            <span style={{ display: "block", fontSize: 14, opacity: 0.92, marginTop: 2 }}>
              {listing.title}
            </span>
            <span style={{ display: "block", fontSize: 12, opacity: 0.7, marginTop: 2 }}>
              {listing.meta}
            </span>
          </span>
        </button>
      </Html>
    </group>
  );
}

// ── A brokerage bay: an alcove recessed off the corridor ─────────────────────
function Bay({
  placement,
  onEnter,
  onSelectListing,
}: {
  placement: BayPlacement;
  onEnter: (id: string) => void;
  onSelectListing: (l: ShowroomListing) => void;
}) {
  const { brokerage, side, z } = placement;
  const sign = side === "right" ? 1 : -1;
  const innerX = sign * HALL_HALF_W; // opening plane
  const backX = sign * (HALL_HALF_W + BAY_DEPTH);
  const accent = new THREE.Color(brokerage.accent);

  // Mural positions on the back wall (2-up grid, centered).
  const muralRotation = side === "right" ? -Math.PI / 2 : Math.PI / 2;
  const muralX = backX - sign * 0.12;
  const listings = brokerage.listings.slice(0, 4);

  return (
    <group>
      {/* Back wall of the alcove */}
      <mesh position={[backX, HALL_H / 2, z]} rotation={[0, muralRotation, 0]}>
        <planeGeometry args={[BAY_HALF_W * 2, HALL_H]} />
        <meshStandardMaterial color="#23262d" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Emissive accent strip framing the bay */}
      <mesh position={[backX - sign * 0.05, 0.06, z]} rotation={[0, muralRotation, 0]}>
        <planeGeometry args={[BAY_HALF_W * 2, 0.12]} />
        <meshStandardMaterial color={brokerage.accent} emissive={accent} emissiveIntensity={2} />
      </mesh>

      {/* Side walls of the alcove */}
      {[z - BAY_HALF_W, z + BAY_HALF_W].map((sz) => (
        <mesh
          key={sz}
          position={[(innerX + backX) / 2, HALL_H / 2, sz]}
          rotation={[0, 0, 0]}
        >
          <planeGeometry args={[BAY_DEPTH, HALL_H]} />
          <meshStandardMaterial color="#101216" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Accent uplight + bright white fill on the murals (museum spotlight feel) */}
      <pointLight
        position={[backX - sign * 1.2, 3.6, z]}
        color={accent}
        intensity={26}
        distance={14}
        decay={2}
      />
      <pointLight
        position={[backX - sign * 2.2, 2.4, z]}
        color="#ffffff"
        intensity={20}
        distance={9}
        decay={2}
      />

      {/* Brokerage nameplate + "enter" trigger above the murals */}
      <Html
        transform
        distanceFactor={4}
        position={[muralX, 4.55, z]}
        rotation={[0, muralRotation, 0]}
        occlude={false}
        style={{ pointerEvents: "auto" }}
      >
        <button
          type="button"
          onClick={() => onEnter(brokerage.id)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#fff",
            textAlign: "center",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            width: 460,
          }}
        >
          <span style={{ display: "block", fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
            {brokerage.name}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 15,
              marginTop: 4,
              color: accent.getStyle(),
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {brokerage.tagline}
          </span>
        </button>
      </Html>

      {/* Listing murals (2 columns × up to 2 rows) */}
      {listings.map((listing, i) => {
        const col = i % 2 === 0 ? -1.2 : 1.2;
        const row = i < 2 ? 2.65 : 1.0;
        const zPos = z + col;
        return (
          <ListingMural
            key={listing.id}
            listing={listing}
            position={[muralX, row, zPos]}
            rotationY={muralRotation}
            accent={brokerage.accent}
            onSelect={onSelectListing}
          />
        );
      })}

      {/* Invisible click target on the opening to "enter" the bay */}
      <mesh
        position={[innerX, HALL_H / 2, z]}
        rotation={[0, muralRotation, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onEnter(brokerage.id);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "default")}
      >
        <planeGeometry args={[BAY_HALF_W * 2, HALL_H]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function ShowroomScene({
  bays,
  target,
  reduced,
  skipIntro,
  onEnterBay,
  onSelectListing,
}: {
  bays: BayPlacement[];
  target: CameraTarget;
  reduced: boolean;
  skipIntro: boolean;
  onEnterBay: (id: string) => void;
  onSelectListing: (l: ShowroomListing) => void;
}) {
  const corridorLen = FRONT_Z - BACK_Z;
  const centerZ = (FRONT_Z + BACK_Z) / 2;
  const pillars = useMemo(() => {
    const arr: number[] = [];
    for (let zz = FRONT_Z - 3; zz > BACK_Z + 2; zz -= 7) arr.push(zz);
    return arr;
  }, []);

  return (
    <>
      <CameraRig target={target} reduced={reduced} skipIntro={skipIntro} />

      {/* Ambient + key lighting (gallery-bright) */}
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#dce8ff", "#101014", 0.9]} />
      <directionalLight position={[6, 14, 12]} intensity={1.1} color="#fff6e8" />
      <directionalLight position={[-8, 10, -6]} intensity={0.5} color="#cfe0ff" />
      {/* Warm ceiling washes down the corridor */}
      {[FRONT_Z - 4, -7, BACK_Z + 5].map((lz) => (
        <pointLight
          key={`wash-${lz}`}
          position={[0, HALL_H - 0.6, lz]}
          intensity={14}
          distance={20}
          decay={2}
          color="#fff1dc"
        />
      ))}

      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, centerZ]}>
        <planeGeometry args={[HALL_HALF_W * 2 + BAY_DEPTH * 2 + 2, corridorLen + 6]} />
        <MeshReflectorMaterial
          mirror={0.75}
          resolution={1024}
          mixBlur={6}
          mixStrength={1.6}
          roughness={0.5}
          depthScale={1}
          color="#16181d"
          metalness={0.6}
        />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALL_H, centerZ]}>
        <planeGeometry args={[HALL_HALF_W * 2 + 1, corridorLen + 6]} />
        <meshStandardMaterial color="#0c0d10" roughness={1} />
      </mesh>

      {/* Far wall with the PropAI wordmark */}
      <mesh position={[0, HALL_H / 2, BACK_Z]}>
        <planeGeometry args={[HALL_HALF_W * 2, HALL_H]} />
        <meshStandardMaterial color="#101218" roughness={0.9} />
      </mesh>
      <Html transform distanceFactor={6} position={[0, 3, BACK_Z + 0.1]} occlude={false}>
        <div
          style={{
            width: 700,
            textAlign: "center",
            color: "#fff",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1 }}>PropAI OS</div>
          <div style={{ fontSize: 18, opacity: 0.65, marginTop: 6 }}>
            The gallery of modern real estate
          </div>
        </div>
      </Html>

      {/* Structural pillars between bays */}
      {pillars.map((pz) =>
        [-HALL_HALF_W, HALL_HALF_W].map((px) => (
          <mesh key={`${pz}-${px}`} position={[px, HALL_H / 2, pz]}>
            <boxGeometry args={[0.3, HALL_H, 0.3]} />
            <meshStandardMaterial color="#1a1c22" metalness={0.3} roughness={0.6} />
          </mesh>
        )),
      )}

      {/* Entrance facade with a glowing doorway the camera flies through */}
      {(() => {
        const fz = FRONT_Z + 1;
        const openHalf = 1.7;
        const openTop = 4.3;
        return (
          <group>
            {[-1, 1].map((s) => (
              <mesh
                key={`facade-${s}`}
                position={[s * (openHalf + (HALL_HALF_W - openHalf) / 2), HALL_H / 2, fz]}
              >
                <boxGeometry args={[HALL_HALF_W - openHalf, HALL_H, 0.4]} />
                <meshStandardMaterial color="#0e1014" roughness={0.8} metalness={0.2} />
              </mesh>
            ))}
            {/* Lintel above the doorway */}
            <mesh position={[0, (openTop + HALL_H) / 2, fz]}>
              <boxGeometry args={[openHalf * 2, HALL_H - openTop, 0.4]} />
              <meshStandardMaterial color="#0e1014" roughness={0.8} metalness={0.2} />
            </mesh>
            {/* Emissive doorway frame */}
            {[-openHalf, openHalf].map((x) => (
              <mesh key={`jamb-${x}`} position={[x, openTop / 2, fz - 0.22]}>
                <boxGeometry args={[0.08, openTop, 0.08]} />
                <meshStandardMaterial color="#bcd4ff" emissive="#9ec5ff" emissiveIntensity={3} />
              </mesh>
            ))}
            <mesh position={[0, openTop, fz - 0.22]}>
              <boxGeometry args={[openHalf * 2, 0.08, 0.08]} />
              <meshStandardMaterial color="#bcd4ff" emissive="#9ec5ff" emissiveIntensity={3} />
            </mesh>
          </group>
        );
      })()}

      {/* Floor guide light strips leading down the corridor */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={`strip-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, centerZ]}>
          <planeGeometry args={[0.12, corridorLen]} />
          <meshStandardMaterial color="#cfe0ff" emissive="#9ec5ff" emissiveIntensity={1.6} />
        </mesh>
      ))}

      {/* Brokerage bays */}
      {bays.map((bay) => (
        <Bay
          key={bay.brokerage.id}
          placement={bay}
          onEnter={onEnterBay}
          onSelectListing={onSelectListing}
        />
      ))}
    </>
  );
}
