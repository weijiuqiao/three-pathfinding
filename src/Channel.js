import { Utils } from './Utils';

class Channel {
  constructor () {
    this.portals = [];
  }

  push (p1, p2) {
    if (p2 === undefined) p2 = p1;
    this.portals.push({
      left: p1,
      right: p2
    });
  }

  stringPull (center=true, forceCoplanar=false) {
    const portals = this.portals;
    const pts = [];
    // Init scan state
    let portalApex, portalLeft, portalRight;
    let apexIndex = 0,
      leftIndex = 0,
      rightIndex = 0;

    portalApex = portals[0].left;
    portalLeft = portals[0].left;
    portalRight = portals[0].right;

    // Add start point.
    pts.push(portalApex);

    for (let i = 1; i < portals.length; i++) {
      const left = portals[i].left;
      const right = portals[i].right;
      // Update right vertex.
      if (Utils.triarea2(portalApex, portalRight, right) <= 0.0) {
        if ((!forceCoplanar || Utils.isCoplanar(portalApex, portalLeft, portalRight, right))
         && (Utils.vequal(portalApex, portalRight) || Utils.triarea2(portalApex, portalLeft, right) >= 0.0)) {
          // Tighten the funnel.
          portalRight = right;
          rightIndex = i;
        } else {
          // Right over left, insert randomly on the portal to avoid sticking on the edge and
          // insert it to path and restart scan from there.
          if (center) {
              const randScalar = 0.5;
              const apex = portalRight.clone().sub(portalLeft).multiplyScalar(randScalar).add(portalLeft);
              pts.push(apex);
              // Make current left the new apex.
              portalApex = apex;

              apexIndex = Math.min(leftIndex, rightIndex);
              if (leftIndex !== rightIndex) {
                // Because now we are now not on the end point anymore, there might be some portals we need to skip
                // in order not to go backward.
                // First we make a line segment connecting the current apex with PortalLeft.
                const segment = { left: portalLeft, right: apex };
                for (let portalIndex=apexIndex; portalIndex<=Math.max(rightIndex, leftIndex); portalIndex++) {
                  // We go through the possibly skippable portals.
                  if (portalIndex === rightIndex || Utils.vequal(portals[portalIndex].right, portalRight)) {
                    // Apex on portal, cannot skip;
                    apexIndex = portalIndex;
                    break;
                  }
                  if (!Utils.portalsIntersect(portals[portalIndex], segment)
                   || (forceCoplanar && !Utils.isCoplanar(apex, portalLeft, portals[portalIndex].left, portals[portalIndex].right) )) {
                    // When our apex segment intersects the current portal, it means it's skippable.
                    // Otherwise we stop iterating. p.s. sharing one end point counts as intersected.
                    apexIndex = portalIndex;
                    break;
                  }
                }
            }
          } else {
            // Right over left, insert left to path and restart scan from portal left point.
            pts.push(portalLeft);
            // Make current left the new apex.
            portalApex = portalLeft;
            apexIndex = leftIndex;
          }
          // Reset portal
          portalLeft = portalApex;
          portalRight = portalApex;
          leftIndex = apexIndex;
          rightIndex = apexIndex;
          // Restart scan
          i = apexIndex;
          continue;
        }
      }

      // Update left vertex.
      if (Utils.triarea2(portalApex, portalLeft, left) >= 0.0) {
        if ((!forceCoplanar || Utils.isCoplanar(portalApex, portalRight, portalLeft, left))
         && (Utils.vequal(portalApex, portalLeft) || Utils.triarea2(portalApex, portalRight, left) <= 0.0)) {
          // Tighten the funnel.
          portalLeft = left;
          leftIndex = i;
        } else {
          if (center) {
            const randScalar = 0.5;
            // Left over right, insert intermediate point to path and restart scan from it.
            const apex = portalLeft.clone().sub(portalRight).multiplyScalar(randScalar).add(portalRight);
            pts.push(apex);
            // Make current apex the new apex.
            portalApex = apex;

            apexIndex = Math.min(rightIndex, leftIndex);
            if (rightIndex !== leftIndex) {
              const segment = { left: apex, right: portalRight };
              for (let portalIndex=apexIndex; portalIndex<=Math.max(rightIndex, leftIndex); portalIndex++) {
                if (portalIndex === leftIndex || Utils.vequal(portals[portalIndex].left, portalLeft)) {
                  // apex on portal
                  apexIndex = portalIndex;
                  break;
                }
                if (!Utils.portalsIntersect(portals[portalIndex], segment)
                 || (forceCoplanar && !Utils.isCoplanar(segment.left, segment.right, portals[portalIndex].left, portals[portalIndex].right))) {
                  // stop looking ahead
                  apexIndex = portalIndex;
                  break;
                }
              }
            }
          } else {
            // Left over right, insert right to path and restart scan from portal right point.
            pts.push(portalRight);
            // Make current right the new apex.
            portalApex = portalRight;
            apexIndex = rightIndex;
          }
          // Reset portal
          portalLeft = portalApex;
          portalRight = portalApex;
          leftIndex = apexIndex;
          rightIndex = apexIndex;
          // Restart scan
          i = apexIndex;
          continue;
        }
      }
    }

    if ((pts.length === 0) || (!Utils.vequal(pts[pts.length - 1], portals[portals.length - 1].left))) {
      // Append last point to path.
      pts.push(portals[portals.length - 1].left);
    }

    this.path = pts;
    return pts;
  }
}

export { Channel };
