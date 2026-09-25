"""
test_occupancy_logic.py
-----------------------
Quick unit tests for occupancy calculation logic.
Run with:  python test_occupancy_logic.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from utils.helpers import calculate_occupancy
from config import (
    STATUS_AVAILABLE, STATUS_NEARLY_FULL, STATUS_FULL, STATUS_OVER_CAP
)


def run_tests():
    test_cases = [
        # (name,             capacity, detected, exp_avail, exp_pct,   exp_status)
        ("Empty Classroom",  60,  0,  60,  0.0,              STATUS_AVAILABLE),
        ("Partially Full",   60, 30,  30, 50.0,              STATUS_AVAILABLE),
        ("Nearly Full",      60, 48,  12, 80.0,              STATUS_NEARLY_FULL),
        ("Full",             60, 60,   0, 100.0,             STATUS_FULL),
        ("Over Capacity",    60, 65,   0, 108.333,           STATUS_OVER_CAP),
    ]

    passed = 0
    failed = 0

    print("=" * 65)
    print("  CLASSROOM OCCUPANCY DETECTOR — Logic Test Suite")
    print("=" * 65)

    for name, cap, det, exp_avail, exp_pct, exp_status in test_cases:
        avail, pct, status = calculate_occupancy(det, cap)
        ok = (
            avail  == exp_avail
            and abs(pct - exp_pct) < 0.01
            and status == exp_status
        )
        tag = "[PASS]" if ok else "[FAIL]"
        if ok:
            passed += 1
        else:
            failed += 1

        print(f"\n  {tag}  -  {name}")
        print(f"         Capacity={cap}, Detected={det}")
        print(f"         Available : got={avail}  expected={exp_avail}")
        print(f"         Occupancy : got={pct:.1f}%  expected={exp_pct:.1f}%")
        print(f"         Status    : got={status}  expected={exp_status}")

    print("\n" + "=" * 65)
    print(f"  Results: {passed} passed, {failed} failed")
    print("=" * 65)

    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
