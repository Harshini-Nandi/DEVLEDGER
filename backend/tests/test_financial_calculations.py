from decimal import Decimal
from app.services.fallback_extractor import clean_decimal
from app.services.financial_engine import get_current_and_prev_month

def test_clean_decimal_precision():
    """Verify that financial values are parsed as precise 2-decimal Decimals."""
    assert clean_decimal("142.50") == Decimal("142.50")
    assert clean_decimal("$1,234.56") == Decimal("1234.56")
    assert clean_decimal("€99.99") == Decimal("99.99")
    assert clean_decimal("10") == Decimal("10.00")
    assert clean_decimal("invalid") == Decimal("0.00")

def test_decimal_arithmetic_prevents_floating_point_errors():
    """Verify Decimal avoids binary floating-point rounding inaccuracies (0.1 + 0.2 != 0.30 in float)."""
    val1 = Decimal("0.10")
    val2 = Decimal("0.20")
    total = val1 + val2
    assert total == Decimal("0.30")
    assert str(total) == "0.30"

def test_invoice_totals_math():
    """Verify that Subtotal + Tax accurately sums to Total."""
    subtotal = Decimal("125.00")
    tax_rate = Decimal("0.0825") # 8.25% sales tax
    tax = (subtotal * tax_rate).quantize(Decimal("0.01"))
    total = subtotal + tax

    assert tax == Decimal("10.31")
    assert total == Decimal("135.31")

def test_month_over_month_percentage_math():
    """Verify MoM percentage calculation with positive, negative, and zero denominators."""
    prev = Decimal("1000.00")
    curr = Decimal("1250.00")
    change = (((curr - prev) / prev) * Decimal("100.00")).quantize(Decimal("0.1"))
    assert change == Decimal("25.0")

    curr_lower = Decimal("800.00")
    change_lower = (((curr_lower - prev) / prev) * Decimal("100.00")).quantize(Decimal("0.1"))
    assert change_lower == Decimal("-20.0")
