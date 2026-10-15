"""Regression checks for archive parsing and financial number integrity."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('market_build', Path(__file__).with_name('build.py'))
market = importlib.util.module_from_spec(spec)
spec.loader.exec_module(market)


class ArchiveTests(unittest.TestCase):
    def report(self, date):
        return market.extract_report(market.ROOT/'crypto-recaps'/f'{date}.md')

    def test_cross_locale_money_and_comparison(self):
        # These two real reports previously produced a thousand-fold discrepancy.
        before = self.report('2026-10-14')['prices'][0]['price']
        after = self.report('2026-10-15')['prices'][0]['price']
        self.assertEqual(before, 83317.05)
        self.assertEqual(after, 81446.41)
        self.assertAlmostEqual((after/before-1)*100, -2.2452067254, places=6)
        self.assertEqual(self.report('2026-09-28')['prices'][0]['price'], 84279)
        self.assertEqual(market.number('−6,30%'), -6.3)
        self.assertIsNone(market.number('N/A'))
        self.assertIsNone(market.number('—'))

    def test_all_archive_prices_are_unique_and_not_other_tables(self):
        for path in (market.ROOT/'crypto-recaps').glob('*.md'):
            r = market.extract_report(path)
            assets = [p['asset'] for p in r['prices']]
            self.assertEqual(len(assets), len(set(assets)), path.name)
            self.assertEqual(len(assets), 6 if path.stem < '2026-09-30' else 9, path.name)
            for p in r['prices']:
                self.assertGreater(p['price'], 0)
                self.assertIsNotNone(p['change'])
            self.assertGreater(r['prices'][0]['price'], 70000)

    def test_signals_follow_signal_column_not_trigger_text(self):
        old = self.report('2026-10-14')
        new = self.report('2026-10-15')
        self.assertEqual(old['prices'][0]['signal'], 'HOLD')
        self.assertTrue(all(p['signal'] == 'SELL' for p in new['prices']))
        self.assertIn('BUY', new['levels'][0]['invalidation'])
        self.assertEqual(new['levels'][0]['signal'], 'SELL')
        # Older archives without explicit labels must not acquire invented HOLDs.
        self.assertTrue(all(p['signal'] is None for p in self.report('2026-09-24')['prices']))

    def test_oil_observations_remain_dated_and_unfilled(self):
        r = self.report('2026-10-15')
        self.assertEqual(r['oilName'], 'Brent (USD/barel)')
        self.assertEqual(len(r['oil']), 15)
        self.assertEqual(r['oil'][0], {'date':'2026-09-16','value':127.84})
        self.assertEqual(r['oil'][-1], {'date':'2026-10-06','value':125.44})
        self.assertNotIn('2026-09-19', [p['date'] for p in r['oil']])
        self.assertNotIn(106.06, [p['value'] for p in r['oil']])

    def test_markup_is_escaped_and_tables_remain_semantic(self):
        rendered = market.render_blocks(market.parse_blocks('## Test\n\n<script>alert(1)</script>\n\n[bad](javascript:alert)\n\n| A | B |\n|---|---|\n| 1 | 2 |'))
        self.assertNotIn('<script>', rendered)
        self.assertNotIn('href="javascript:', rendered)
        self.assertIn('&lt;script&gt;', rendered)
        self.assertIn('<thead>', rendered)
        self.assertIn('scope="col"', rendered)

    def test_snapshot_and_source_remain_attached(self):
        r = self.report('2026-10-15')
        self.assertIn('08.44–08.45 WITA', r['snapshot'])
        self.assertNotIn('Candle konfirmasi', r['snapshot'])
        self.assertIn('/2026-10-15.md', r['source'])
        self.assertEqual(len({s['id'] for s in r['sections']}), len(r['sections']))
        self.assertIn('Brent spot terakhir 6 Oktober', r['intro'])


if __name__ == '__main__':
    unittest.main()
